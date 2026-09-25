import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	apiKeyHeaders,
	asMember,
	asUser,
	createApiKeyCredentials,
} from '../support/auth';
import { createCommissionFunction, createMember } from '../support/factories';
import {
	commissionFunctionBody,
	createCircle,
	createProgramWithRoles,
	ProgramWithRoles,
	switchCircleFunctionBody,
} from '../support/circle-helpers';
import { Condition, Function } from '../../src/entities';
import { commissionTypeEnum, triggerEnum } from '../../src/enums';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

interface FunctionBody {
	function_id: string;
	name: string;
	trigger: string;
	effect_type: string;
	status?: string;
	circle_id: string;
	circle_name: string;
	effect: Record<string, unknown>;
	conditions: {
		condition_id: string;
		condition: { parameter: string; operator: string; value: unknown };
	}[];
}

/**
 * Functions are a program's commission rules: on a trigger (signup or
 * purchase) for promoters in a circle, either generate a fixed/percentage
 * commission or switch the promoter to another circle, optionally gated by
 * conditions. Covers CRUD, list filters, condition replacement, validation
 * and authorization (admin/editor manage, viewer reads, API keys have no
 * access to functions).
 */
describe('functions (e2e)', () => {
	let app: INestApplication<App>;
	let dataSource: DataSource;

	beforeAll(async () => {
		app = await createTestApp({ http: true });
		dataSource = app.get(DataSource);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	const functionsPath = (f: Pick<ProgramWithRoles, 'program'>) =>
		`/api/programs/${f.program.programId}/functions`;

	async function createViaApi(
		f: ProgramWithRoles,
		body: Record<string, unknown>,
	): Promise<FunctionBody> {
		const response = await request(app.getHttpServer())
			.post(functionsPath(f))
			.set(...asUser(app, f.admin))
			.send(body)
			.expect(201);
		return response.body.data as FunctionBody;
	}

	/**
	 * POST /programs/:program_id/functions
	 */
	describe('create', () => {
		it('creates a fixed generate_commission function', async () => {
			const f = await createProgramWithRoles(dataSource);

			const response = await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...asUser(app, f.admin))
				.send(commissionFunctionBody(f.defaultCircle.circleId))
				.expect(201);

			expect(response.body.data).toMatchObject({
				function_id: expect.any(String),
				name: 'Signup bonus',
				trigger: 'signup',
				effect_type: 'generate_commission',
				effect: {
					commission: {
						commission_type: 'fixed',
						commission_value: 5,
					},
				},
				conditions: [],
				circle_id: f.defaultCircle.circleId,
				circle_name: 'DEFAULT_CIRCLE',
			});

			const stored = await dataSource
				.getRepository(Function)
				.findOneByOrFail({
					functionId: response.body.data.function_id,
				});
			expect(stored.programId).toBe(f.program.programId);
			expect(stored.circleId).toBe(f.defaultCircle.circleId);
			expect(stored.status).toBe('active');
			expect(stored.effect).toEqual({
				commission: { commissionType: 'fixed', commissionValue: 5 },
			});
		});

		it('creates a percentage commission gated by one condition of each parameter', async () => {
			const f = await createProgramWithRoles(dataSource);

			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId, {
					name: 'Big spender',
					trigger: 'purchase',
					status: 'inactive',
					effect: {
						commission: {
							commission_type: 'percentage',
							commission_value: 12.5,
						},
					},
					conditions: [
						{
							condition: {
								parameter: 'revenue',
								operator: 'greater_than',
								value: 100,
							},
						},
						{
							condition: {
								parameter: 'item_id',
								operator: 'contains',
								value: 'sku-1',
							},
						},
						{
							condition: {
								parameter: 'no. of signups',
								operator: 'equals',
								value: 3,
							},
						},
						{
							condition: {
								parameter: 'no. of purchases',
								operator: 'less_than',
								value: 2,
							},
						},
					],
				}),
			);

			expect(created.effect).toEqual({
				commission: {
					commission_type: 'percentage',
					commission_value: 12.5,
				},
			});
			expect(created.conditions.map((c) => c.condition)).toEqual([
				{ parameter: 'revenue', operator: 'greater_than', value: 100 },
				{ parameter: 'item_id', operator: 'contains', value: 'sku-1' },
				{ parameter: 'no. of signups', operator: 'equals', value: 3 },
				{
					parameter: 'no. of purchases',
					operator: 'less_than',
					value: 2,
				},
			]);

			// Conditions are linked to the function and stored as strings.
			const stored = await dataSource.getRepository(Condition).find({
				where: { func: { functionId: created.function_id } },
			});
			expect(stored.map((c) => c.value).sort()).toEqual([
				'100',
				'2',
				'3',
				'sku-1',
			]);

			const fn = await dataSource
				.getRepository(Function)
				.findOneByOrFail({ functionId: created.function_id });
			expect(fn.status).toBe('inactive');
		});

		it('creates a switch_circle function targeting another circle of the program', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');

			const created = await createViaApi(
				f,
				switchCircleFunctionBody(
					f.defaultCircle.circleId,
					gold.circleId,
				),
			);

			expect(created).toMatchObject({
				effect_type: 'switch_circle',
				trigger: 'purchase',
				effect: { target_circle_id: gold.circleId },
				circle_id: f.defaultCircle.circleId,
			});

			// Stored under the camelCase key FunctionTriggerService reads.
			const stored = await dataSource
				.getRepository(Function)
				.findOneByOrFail({ functionId: created.function_id });
			expect(stored.effect).toEqual({ targetCircleId: gold.circleId });
		});

		it('404s when the switch_circle target belongs to another program', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...asUser(app, f.admin))
				.send(
					switchCircleFunctionBody(
						f.defaultCircle.circleId,
						f.otherDefaultCircle.circleId,
					),
				)
				.expect(404);

			expect(
				await dataSource
					.getRepository(Function)
					.countBy({ programId: f.program.programId }),
			).toBe(0);
		});

		it('404s when circle_id belongs to another program', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...asUser(app, f.admin))
				.send(commissionFunctionBody(f.otherDefaultCircle.circleId))
				.expect(404);
		});

		it('404s for an unknown circle_id', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...asUser(app, f.admin))
				.send(commissionFunctionBody(UNKNOWN_ID))
				.expect(404);
		});
	});

	/**
	 * Top-level DTO validation. (Nested effect/condition validation is not
	 * covered: those rejections currently surface as 500, see report.)
	 */
	describe('create validation', () => {
		const cases: [string, (circleId: string) => Record<string, unknown>][] =
			[
				[
					'an unknown trigger',
					(c) => commissionFunctionBody(c, { trigger: 'click' }),
				],
				[
					'a missing name',
					(c) => commissionFunctionBody(c, { name: undefined }),
				],
				[
					'a missing effect',
					(c) => commissionFunctionBody(c, { effect: undefined }),
				],
				[
					'an unknown status',
					(c) => commissionFunctionBody(c, { status: 'paused' }),
				],
				[
					'a non-uuid circle_id',
					() => commissionFunctionBody('not-a-uuid'),
				],
				[
					'conditions that are not an array',
					(c) =>
						commissionFunctionBody(c, {
							conditions: {
								condition: {
									parameter: 'revenue',
									operator: 'equals',
									value: 5,
								},
							},
						}),
				],
				[
					'an undeclared property',
					(c) => commissionFunctionBody(c, { program_id: c }),
				],
			];

		it.each(cases)('400s on %s', async (_label, build) => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...asUser(app, f.admin))
				.send(build(f.defaultCircle.circleId))
				.expect(400);

			expect(
				await dataSource
					.getRepository(Function)
					.countBy({ programId: f.program.programId }),
			).toBe(0);
		});
	});

	/**
	 * GET /programs/:program_id/functions. Omitted filters reach the service
	 * as `undefined` and must mean "unfiltered" (TypeORM 1.x regression area).
	 */
	describe('list', () => {
		async function seedFunctions() {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			const signupFixed = await createCommissionFunction(
				dataSource,
				f.program,
				f.defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
					name: 'signup-fixed',
				},
			);
			const purchasePct = await createCommissionFunction(
				dataSource,
				f.program,
				gold,
				{
					trigger: triggerEnum.PURCHASE,
					commissionType: commissionTypeEnum.PERCENTAGE,
					commissionValue: 10,
					name: 'purchase-pct',
				},
			);
			const promote = await createViaApi(
				f,
				switchCircleFunctionBody(
					f.defaultCircle.circleId,
					gold.circleId,
					{
						name: 'promote',
					},
				),
			);
			// Noise from another program must never show up.
			await createCommissionFunction(
				dataSource,
				f.otherProgram,
				f.otherDefaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 1,
				},
			);
			return {
				f,
				gold,
				ids: {
					signupFixed: signupFixed.functionId,
					purchasePct: purchasePct.functionId,
					promote: promote.function_id,
				},
			};
		}

		async function list(
			f: ProgramWithRoles,
			query: Record<string, string | number>,
		) {
			const response = await request(app.getHttpServer())
				.get(functionsPath(f))
				.query(query)
				.set(...asUser(app, f.admin))
				.expect(200);
			return response.body.data as {
				items: FunctionBody[];
				count?: number;
				skip: number;
				take: number;
			};
		}

		const ids = (items: FunctionBody[]) =>
			items.map((i) => i.function_id).sort();

		it('returns every function of the program when no filter is given', async () => {
			const { f, ids: seeded } = await seedFunctions();

			const data = await list(f, {});

			expect(ids(data.items)).toEqual(
				[seeded.signupFixed, seeded.purchasePct, seeded.promote].sort(),
			);
			expect(data).toMatchObject({ count: 3, skip: 0, take: 10 });
		});

		it('filters by trigger', async () => {
			const { f, ids: seeded } = await seedFunctions();

			const data = await list(f, { trigger: 'signup' });

			expect(ids(data.items)).toEqual([seeded.signupFixed]);
		});

		it('filters by effect_type and names the switch target circle', async () => {
			const { f, gold, ids: seeded } = await seedFunctions();

			const data = await list(f, { effect_type: 'switch_circle' });

			expect(ids(data.items)).toEqual([seeded.promote]);
			expect(data.items[0].effect).toEqual({
				target_circle_id: gold.circleId,
				target_circle_name: 'Gold',
			});
		});

		it('filters by circle_id', async () => {
			const { f, gold, ids: seeded } = await seedFunctions();

			const data = await list(f, { circle_id: gold.circleId });

			expect(ids(data.items)).toEqual([seeded.purchasePct]);
			expect(data.items[0].circle_name).toBe('Gold');
		});

		it('combines filters', async () => {
			const { f, ids: seeded } = await seedFunctions();

			const matching = await list(f, {
				circle_id: f.defaultCircle.circleId,
				trigger: 'purchase',
				effect_type: 'switch_circle',
			});
			expect(ids(matching.items)).toEqual([seeded.promote]);

			const none = await list(f, {
				circle_id: f.defaultCircle.circleId,
				trigger: 'signup',
				effect_type: 'switch_circle',
			});
			expect(none.items).toEqual([]);
		});

		it('pages with skip and take while counting every match', async () => {
			const { f } = await seedFunctions();

			const data = await list(f, { skip: 1, take: 1 });

			expect(data.items).toHaveLength(1);
			expect(data).toMatchObject({ count: 3, skip: 1, take: 1 });
		});
	});

	/**
	 * GET /programs/:program_id/functions/:function_id
	 */
	describe('get', () => {
		it('returns the function with its conditions', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId, {
					conditions: [
						{
							condition: {
								parameter: 'revenue',
								operator: 'greater_than_or_equal_to',
								value: 50,
							},
						},
					],
				}),
			);

			const response = await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.expect(200);

			expect(response.body.data).toEqual(created);
		});

		it('404s for an unknown function', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${UNKNOWN_ID}`)
				.set(...asUser(app, f.admin))
				.expect(404);
		});

		it("404s for another program's function addressed through this program", async () => {
			const f = await createProgramWithRoles(dataSource);
			const foreign = await createCommissionFunction(
				dataSource,
				f.otherProgram,
				f.otherDefaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${foreign.functionId}`)
				.set(...asUser(app, f.admin))
				.expect(404);
		});
	});

	/**
	 * PATCH /programs/:program_id/functions/:function_id
	 */
	describe('update', () => {
		async function get(f: ProgramWithRoles, functionId: string) {
			const response = await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${functionId}`)
				.set(...asUser(app, f.admin))
				.expect(200);
			return response.body.data as FunctionBody;
		}

		async function createWithConditions(f: ProgramWithRoles) {
			return createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId, {
					conditions: [
						{
							condition: {
								parameter: 'revenue',
								operator: 'greater_than',
								value: 100,
							},
						},
						{
							condition: {
								parameter: 'item_id',
								operator: 'equals',
								value: 'sku-1',
							},
						},
					],
				}),
			);
		}

		it('updates name, trigger and status and leaves conditions alone when omitted', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createWithConditions(f);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({
					name: 'Renamed',
					trigger: 'purchase',
					status: 'inactive',
				})
				.expect(200);

			const after = await get(f, created.function_id);
			expect(after).toMatchObject({
				name: 'Renamed',
				trigger: 'purchase',
			});
			expect(after.conditions).toEqual(created.conditions);

			const stored = await dataSource
				.getRepository(Function)
				.findOneByOrFail({ functionId: created.function_id });
			expect(stored.status).toBe('inactive');
		});

		it('replaces conditions: updates by condition_id, adds new ones, drops omitted ones', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createWithConditions(f);
			const [revenue, itemId] = created.conditions;

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({
					conditions: [
						{
							condition_id: revenue.condition_id,
							condition: {
								parameter: 'revenue',
								operator: 'greater_than_or_equal_to',
								value: 500,
							},
						},
						{
							condition: {
								parameter: 'no. of purchases',
								operator: 'greater_than',
								value: 7,
							},
						},
					],
				})
				.expect(200);

			const after = await get(f, created.function_id);
			expect(after.conditions).toHaveLength(2);
			expect(after.conditions).toEqual(
				expect.arrayContaining([
					{
						condition_id: revenue.condition_id,
						condition: {
							parameter: 'revenue',
							operator: 'greater_than_or_equal_to',
							value: 500,
						},
					},
					{
						condition_id: expect.any(String),
						condition: {
							parameter: 'no. of purchases',
							operator: 'greater_than',
							value: 7,
						},
					},
				]),
			);
			expect(
				await dataSource
					.getRepository(Condition)
					.existsBy({ conditionId: itemId.condition_id }),
			).toBe(false);
		});

		it('clears every condition with an empty array', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createWithConditions(f);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({ conditions: [] })
				.expect(200);

			expect((await get(f, created.function_id)).conditions).toEqual([]);
			expect(
				await dataSource.getRepository(Condition).countBy({
					func: { functionId: created.function_id },
				}),
			).toBe(0);
		});

		it('replaces the commission effect', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId),
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({
					effect_type: 'generate_commission',
					effect: {
						commission: {
							commission_type: 'percentage',
							commission_value: 20,
						},
					},
				})
				.expect(200);

			expect((await get(f, created.function_id)).effect).toEqual({
				commission: {
					commission_type: 'percentage',
					commission_value: 20,
				},
			});
		});

		it('turns a commission function into a switch_circle function', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId),
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({
					effect_type: 'switch_circle',
					effect: { target_circle_id: gold.circleId },
				})
				.expect(200);

			const after = await get(f, created.function_id);
			expect(after.effect_type).toBe('switch_circle');
			expect(after.effect).toEqual({ target_circle_id: gold.circleId });
		});

		it('moves the function to another circle of the program', async () => {
			const f = await createProgramWithRoles(dataSource);
			const gold = await createCircle(dataSource, f.program, 'Gold');
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId),
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({ circle_id: gold.circleId })
				.expect(200);

			expect(await get(f, created.function_id)).toMatchObject({
				circle_id: gold.circleId,
				circle_name: 'Gold',
			});
		});

		it('404s switching to a target circle of another program', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId),
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({
					effect_type: 'switch_circle',
					effect: { target_circle_id: f.otherDefaultCircle.circleId },
				})
				.expect(404);

			expect((await get(f, created.function_id)).effect_type).toBe(
				'generate_commission',
			);
		});

		it('404s for an unknown function', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${UNKNOWN_ID}`)
				.set(...asUser(app, f.admin))
				.send({ name: 'Nope' })
				.expect(404);
		});

		it("404s for another program's function addressed through this program", async () => {
			const f = await createProgramWithRoles(dataSource);
			const foreign = await createCommissionFunction(
				dataSource,
				f.otherProgram,
				f.otherDefaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${foreign.functionId}`)
				.set(...asUser(app, f.admin))
				.send({ name: 'Hijacked' })
				.expect(404);

			const stored = await dataSource
				.getRepository(Function)
				.findOneByOrFail({ functionId: foreign.functionId });
			expect(stored.name).toBe(foreign.name);
		});

		it('400s on an undeclared property', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId),
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({ program_id: f.otherProgram.programId })
				.expect(400);
		});

		it('400s on an unknown trigger', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId),
			);

			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.send({ trigger: 'click' })
				.expect(400);
		});
	});

	/**
	 * DELETE /programs/:program_id/functions/:function_id
	 */
	describe('delete', () => {
		it('deletes the function together with its conditions', async () => {
			const f = await createProgramWithRoles(dataSource);
			const created = await createViaApi(
				f,
				commissionFunctionBody(f.defaultCircle.circleId, {
					conditions: [
						{
							condition: {
								parameter: 'revenue',
								operator: 'greater_than',
								value: 100,
							},
						},
					],
				}),
			);

			await request(app.getHttpServer())
				.delete(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.expect(200);

			await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${created.function_id}`)
				.set(...asUser(app, f.admin))
				.expect(404);
			expect(
				await dataSource
					.getRepository(Condition)
					.existsBy({
						conditionId: created.conditions[0].condition_id,
					}),
			).toBe(false);
		});

		it('404s for an unknown function', async () => {
			const f = await createProgramWithRoles(dataSource);

			await request(app.getHttpServer())
				.delete(`${functionsPath(f)}/${UNKNOWN_ID}`)
				.set(...asUser(app, f.admin))
				.expect(404);
		});

		it("404s for another program's function addressed through this program", async () => {
			const f = await createProgramWithRoles(dataSource);
			const foreign = await createCommissionFunction(
				dataSource,
				f.otherProgram,
				f.otherDefaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await request(app.getHttpServer())
				.delete(`${functionsPath(f)}/${foreign.functionId}`)
				.set(...asUser(app, f.admin))
				.expect(404);

			expect(
				await dataSource
					.getRepository(Function)
					.existsBy({ functionId: foreign.functionId }),
			).toBe(true);
		});
	});

	/**
	 * Program users: admin and editor manage functions; viewer reads only; a
	 * user with no role in the program is refused.
	 */
	describe('authorization: program users', () => {
		it.each<'admin' | 'editor'>(['admin', 'editor'])(
			'%s can create, update and delete functions',
			async (role) => {
				const f = await createProgramWithRoles(dataSource);
				const header = asUser(app, f[role]);

				const created = await request(app.getHttpServer())
					.post(functionsPath(f))
					.set(...header)
					.send(commissionFunctionBody(f.defaultCircle.circleId))
					.expect(201);
				const functionId = created.body.data.function_id as string;

				await request(app.getHttpServer())
					.patch(`${functionsPath(f)}/${functionId}`)
					.set(...header)
					.send({ name: 'Renamed' })
					.expect(200);
				await request(app.getHttpServer())
					.delete(`${functionsPath(f)}/${functionId}`)
					.set(...header)
					.expect(200);
			},
		);

		it('viewer can list and read functions but not change them', async () => {
			const f = await createProgramWithRoles(dataSource);
			const header = asUser(app, f.viewer);
			const fn = await createCommissionFunction(
				dataSource,
				f.program,
				f.defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			const list = await request(app.getHttpServer())
				.get(functionsPath(f))
				.set(...header)
				.expect(200);
			expect(list.body.data.items).toHaveLength(1);
			await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${fn.functionId}`)
				.set(...header)
				.expect(200);

			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...header)
				.send(commissionFunctionBody(f.defaultCircle.circleId))
				.expect(403);
			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${fn.functionId}`)
				.set(...header)
				.send({ name: 'Renamed' })
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${functionsPath(f)}/${fn.functionId}`)
				.set(...header)
				.expect(403);

			const stored = await dataSource
				.getRepository(Function)
				.findOneByOrFail({ functionId: fn.functionId });
			expect(stored.name).toBe(fn.name);
		});

		it("a user of another program can neither read nor manage this program's functions", async () => {
			const f = await createProgramWithRoles(dataSource);
			const header = asUser(app, f.outsider);
			const fn = await createCommissionFunction(
				dataSource,
				f.program,
				f.defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await request(app.getHttpServer())
				.get(functionsPath(f))
				.set(...header)
				.expect(403);
			await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${fn.functionId}`)
				.set(...header)
				.expect(403);
			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(...header)
				.send(commissionFunctionBody(f.defaultCircle.circleId))
				.expect(403);
			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${fn.functionId}`)
				.set(...header)
				.send({ name: 'Hijacked' })
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${functionsPath(f)}/${fn.functionId}`)
				.set(...header)
				.expect(403);

			expect(
				await dataSource
					.getRepository(Function)
					.countBy({ programId: f.program.programId }),
			).toBe(1);
		});

		it('rejects a promoter member token', async () => {
			const f = await createProgramWithRoles(dataSource);
			const member = await createMember(dataSource, f.program);

			// As with circles: no program-user context on a member token, so
			// AuthorizationService answers 400 before any ability check.
			await request(app.getHttpServer())
				.get(functionsPath(f))
				.set(...asMember(app, member))
				.expect(400);
		});
	});

	/**
	 * getApiUserAbility grants program API keys `manage` on circles but
	 * nothing on Function, so a program key cannot even read functions.
	 */
	describe('authorization: program API keys', () => {
		it('cannot list, read, create, update or delete functions', async () => {
			const f = await createProgramWithRoles(dataSource);
			const headers = apiKeyHeaders(
				await createApiKeyCredentials(dataSource, f.program.programId),
			);
			const fn = await createCommissionFunction(
				dataSource,
				f.program,
				f.defaultCircle,
				{
					trigger: triggerEnum.SIGNUP,
					commissionType: commissionTypeEnum.FIXED,
					commissionValue: 5,
				},
			);

			await request(app.getHttpServer())
				.get(functionsPath(f))
				.set(headers)
				.expect(403);
			await request(app.getHttpServer())
				.get(`${functionsPath(f)}/${fn.functionId}`)
				.set(headers)
				.expect(403);
			await request(app.getHttpServer())
				.post(functionsPath(f))
				.set(headers)
				.send(commissionFunctionBody(f.defaultCircle.circleId))
				.expect(403);
			await request(app.getHttpServer())
				.patch(`${functionsPath(f)}/${fn.functionId}`)
				.set(headers)
				.send({ name: 'Renamed' })
				.expect(403);
			await request(app.getHttpServer())
				.delete(`${functionsPath(f)}/${fn.functionId}`)
				.set(headers)
				.expect(403);

			expect(
				await dataSource
					.getRepository(Function)
					.countBy({ programId: f.program.programId }),
			).toBe(1);
		});
	});
});
