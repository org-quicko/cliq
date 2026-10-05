import { DataSource } from 'typeorm';
import { Circle, Program, User } from '../../src/entities';
import { userRoleEnum } from '../../src/enums';
import { addUserToProgram, createProgram, createUser } from './factories';

/**
 * Shared arrangement for the circle and function specs: a program with one
 * user per program role, plus an outsider who belongs to a different program.
 */
export interface ProgramWithRoles {
	program: Program;
	defaultCircle: Circle;
	admin: User;
	editor: User;
	viewer: User;
	/** Admin of another program, with no role in `program`. */
	outsider: User;
	otherProgram: Program;
	otherDefaultCircle: Circle;
}

export async function createProgramWithRoles(
	dataSource: DataSource,
): Promise<ProgramWithRoles> {
	const { program: otherProgram, defaultCircle: otherDefaultCircle } =
		await createProgram(dataSource);
	const { program, defaultCircle } = await createProgram(dataSource);

	const admin = await createUser(dataSource);
	const editor = await createUser(dataSource);
	const viewer = await createUser(dataSource);
	const outsider = await createUser(dataSource);

	await addUserToProgram(dataSource, admin, program, userRoleEnum.ADMIN);
	await addUserToProgram(dataSource, editor, program, userRoleEnum.EDITOR);
	await addUserToProgram(dataSource, viewer, program, userRoleEnum.VIEWER);
	await addUserToProgram(
		dataSource,
		outsider,
		otherProgram,
		userRoleEnum.ADMIN,
	);

	return {
		program,
		defaultCircle,
		admin,
		editor,
		viewer,
		outsider,
		otherProgram,
		otherDefaultCircle,
	};
}

/** A non-default circle in `program`, written straight through TypeORM. */
export async function createCircle(
	dataSource: DataSource,
	program: Program,
	name = 'Gold',
): Promise<Circle> {
	const repo = dataSource.getRepository(Circle);
	return repo.save(
		repo.create({
			name,
			isDefaultCircle: false,
			programId: program.programId,
		}),
	);
}

export interface CircleRow {
	circle_id: string;
	name: string;
	number_of_promoters: number;
	is_default_circle: boolean;
}

interface CircleWorkbookBody {
	data: {
		sheets: { blocks: { header: string[]; rows: unknown[][] }[] }[];
		metadata: { skip: number; take: number; total: number };
	};
}

/**
 * GET /circles answers with a workbook (sheet -> table -> header + positional
 * rows). This zips each row with the header so assertions can use names.
 */
export function circleRows(body: unknown): CircleRow[] {
	const table = (body as CircleWorkbookBody).data.sheets[0].blocks[0];
	return table.rows.map(
		(row) =>
			Object.fromEntries(
				table.header.map((column, i) => [column, row[i]]),
			) as unknown as CircleRow,
	);
}

export function circleListMetadata(body: unknown) {
	return (body as CircleWorkbookBody).data.metadata;
}

/** A valid generate_commission create payload, in the API's snake_case. */
export function commissionFunctionBody(
	circleId: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		name: 'Signup bonus',
		trigger: 'signup',
		effect_type: 'generate_commission',
		effect: {
			commission: { commission_type: 'fixed', commission_value: 5 },
		},
		circle_id: circleId,
		...overrides,
	};
}

/**
 * A valid switch_circle create payload. `target_circle_id` is what the
 * frontend sends (its SwitchCircleEffect exposes that name toPlainOnly).
 */
export function switchCircleFunctionBody(
	circleId: string,
	targetCircleId: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		name: 'Promote to gold',
		trigger: 'purchase',
		effect_type: 'switch_circle',
		effect: { target_circle_id: targetCircleId },
		circle_id: circleId,
		...overrides,
	};
}
