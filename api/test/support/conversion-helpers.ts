import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Circle, Condition, Function, Link, Program } from '../../src/entities';
import {
	conditionOperatorEnum,
	conditionParameterEnum,
	effectEnum,
	functionStatusEnum,
	linkStatusEnum,
	triggerEnum,
} from '../../src/enums';
import { FunctionTriggerService } from '../../src/services/functionTrigger.service';
import { PromoterWebhookPublisherService } from '../../src/services/promoterWebhookPublisher.service';
import { WebhookPublisherService } from '../../src/services/webhookPublisher.service';
import { unique } from './factories';

/**
 * Signups and purchases hand their follow-up work (commission functions,
 * webhook fan-out) to `@OnEvent` listeners that EventEmitter2 fires without
 * awaiting, so the HTTP response returns before any commission exists.
 *
 * @nestjs/event-emitter resolves `instance[methodKey]` at call time, so
 * wrapping the listener method on the provider instance lets a test collect
 * every in-flight invocation and wait for them. `settle()` loops because a
 * listener can emit further events (a commission emits COMMISSION_CREATED).
 *
 * Waiting matters for correctness, not just for positive assertions: with
 * the isolated transaction every query shares one connection, so a listener
 * still running when the test ends would race the ROLLBACK.
 */
export interface ListenerTracker {
	settle(): Promise<void>;
}

const LISTENERS: [abstract new (...args: never[]) => object, string][] = [
	[FunctionTriggerService, 'triggerProgramFunctions'],
	[WebhookPublisherService, 'handleEvent'],
	[PromoterWebhookPublisherService, 'handleEvent'],
];

export function trackEventListeners(app: INestApplication): ListenerTracker {
	const pending = new Set<Promise<void>>();

	for (const [token, methodKey] of LISTENERS) {
		const instance = app.get(token, { strict: false }) as Record<
			string,
			(...args: unknown[]) => Promise<unknown>
		>;
		const original = instance[methodKey];
		instance[methodKey] = function (this: unknown, ...args: unknown[]) {
			const promise: Promise<unknown> = original.call(this, ...args);
			// Tracked promises must never reject into the tracker; the
			// event-emitter wrapper already handles (and swallows) failures.
			const settled: Promise<void> = promise.then(
				() => undefined,
				() => undefined,
			);
			pending.add(settled);
			void settled.finally(() => pending.delete(settled));
			return promise;
		};
	}

	return {
		async settle() {
			while (pending.size > 0) {
				await Promise.all(pending);
				// Let listeners emitted by the ones that just finished register.
				await new Promise((resolve) => setImmediate(resolve));
			}
		},
	};
}

/** An active switch-circle function: moves promoters from `circle` to `targetCircle`. */
export async function createSwitchCircleFunction(
	dataSource: DataSource,
	program: Program,
	circle: Circle,
	targetCircle: Circle,
	trigger: triggerEnum,
): Promise<Function> {
	const repo = dataSource.getRepository(Function);
	return repo.save(
		repo.create({
			name: unique('Switch'),
			trigger,
			effectType: effectEnum.SWITCH_CIRCLE,
			// Stored the way FunctionService persists a SwitchCircleEffect
			// instance (camelCase keys; `target_circle_id` is toPlainOnly).
			effect: { targetCircleId: targetCircle.circleId },
			status: functionStatusEnum.ACTIVE,
			circleId: circle.circleId,
			programId: program.programId,
		} as Partial<Function>),
	);
}

export async function addCondition(
	dataSource: DataSource,
	func: Function,
	parameter: conditionParameterEnum,
	operator: conditionOperatorEnum,
	value: string | number,
): Promise<Condition> {
	const repo = dataSource.getRepository(Condition);
	return repo.save(
		repo.create({
			parameter,
			operator,
			value: String(value),
			func: { functionId: func.functionId },
		}),
	);
}

export async function setFunctionStatus(
	dataSource: DataSource,
	func: Function,
	status: functionStatusEnum,
): Promise<void> {
	await dataSource
		.getRepository(Function)
		.update({ functionId: func.functionId }, { status });
}

export async function archiveLink(
	dataSource: DataSource,
	link: Link,
): Promise<void> {
	await dataSource
		.getRepository(Link)
		.update({ linkId: link.linkId }, { status: linkStatusEnum.ARCHIVED });
}

export async function createCircle(
	dataSource: DataSource,
	program: Program,
	name = unique('Circle'),
): Promise<Circle> {
	const repo = dataSource.getRepository(Circle);
	return repo.save(repo.create({ name, isDefaultCircle: false, program }));
}

interface WorkbookBlock {
	name: string;
	header: string[];
	rows: unknown[][];
}

/**
 * Pulls one table out of a "workbook" response (`data.sheets[].blocks[]`) as
 * row objects keyed by the table's header. Promoter endpoints return the
 * whole workbook with every sheet present, so tables are found by name
 * rather than position.
 */
export function workbookTable(
	body: unknown,
	tableName: string,
): Record<string, unknown>[] {
	const workbook = body as {
		data: { sheets: { blocks: WorkbookBlock[] }[] };
	};
	const block = workbook.data.sheets
		.flatMap((sheet) => sheet.blocks)
		.find((b) => b.name === tableName);
	if (!block) {
		throw new Error(`workbook has no table named ${tableName}`);
	}
	return block.rows.map((row) =>
		Object.fromEntries(block.header.map((column, i) => [column, row[i]])),
	);
}

/** Parses a small, unquoted CSV body into row objects keyed by its header line. */
export function parseCsv(text: string): Record<string, string>[] {
	const [headerLine, ...lines] = text.trim().split(/\r?\n/);
	const header = headerLine.split(',');
	return lines.map((line) => {
		const cells = line.split(',');
		return Object.fromEntries(
			header.map((column, i) => [column, cells[i] ?? '']),
		);
	});
}
