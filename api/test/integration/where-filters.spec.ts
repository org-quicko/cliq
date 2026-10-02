import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	addUserToProgram,
	createCommissionFunction,
	createLink,
	createProgram,
	createPromoter,
	createUser,
} from '../support/factories';
import { ProgramService } from '../../src/services/program.service';
import { FunctionService } from '../../src/services/function.service';
import { LinkService } from '../../src/services/link.service';
import {
	commissionTypeEnum,
	triggerEnum,
	userRoleEnum,
	visibilityEnum,
} from '../../src/enums';

/**
 * Regression coverage for the TypeORM 1.0 behavior change the upgrade is
 * riskiest on: `where` clauses used to silently drop an `undefined` property
 * (0.3.x); 1.x throws unless `invalidWhereValuesBehavior.undefined` is
 * 'ignore' (see src/config/database.config.ts).
 *
 * Controllers pass optional query params straight through as shorthand
 * properties (`{ name, visibility }`), so an omitted param reaches the
 * service as `name: undefined`, not an absent key. These prove that still
 * means "unfiltered" end to end through the real services.
 */
describe('optional where-clause filters', () => {
	let app: INestApplication;
	let dataSource: DataSource;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	describe('ProgramService.getAllPrograms', () => {
		async function seedPrograms() {
			const user = await createUser(dataSource);
			const { program: publicProgram } = await createProgram(dataSource, {
				name: 'Public Program',
				visibility: visibilityEnum.PUBLIC,
			});
			const { program: privateProgram } = await createProgram(
				dataSource,
				{
					name: 'Private Program',
					visibility: visibilityEnum.PRIVATE,
				},
			);
			await addUserToProgram(
				dataSource,
				user,
				publicProgram,
				userRoleEnum.ADMIN,
			);
			await addUserToProgram(
				dataSource,
				user,
				privateProgram,
				userRoleEnum.VIEWER,
			);
			return user;
		}

		it("omitting every filter returns all of the user's programs", async () => {
			const user = await seedPrograms();

			const programs = await app
				.get(ProgramService)
				.getAllPrograms(user.userId, {
					name: undefined,
					visibility: undefined,
				});

			expect(programs).toHaveLength(2);
		});

		it('a provided filter still narrows the results', async () => {
			const user = await seedPrograms();

			const programs = await app
				.get(ProgramService)
				.getAllPrograms(user.userId, {
					name: undefined,
					visibility: visibilityEnum.PRIVATE,
				});

			expect(programs).toHaveLength(1);
			expect(programs[0]).toMatchObject({
				program: { name: 'Private Program' },
			});
		});
	});

	describe('FunctionService.getAllFunctions', () => {
		async function seedFunctions() {
			const { program, defaultCircle } = await createProgram(dataSource);
			await createCommissionFunction(dataSource, program, defaultCircle, {
				trigger: triggerEnum.SIGNUP,
				commissionType: commissionTypeEnum.FIXED,
				commissionValue: 5,
			});
			await createCommissionFunction(dataSource, program, defaultCircle, {
				trigger: triggerEnum.PURCHASE,
				commissionType: commissionTypeEnum.PERCENTAGE,
				commissionValue: 10,
			});
			return program;
		}

		it('omitting circle_id, trigger and effect_type returns every function', async () => {
			const program = await seedFunctions();

			const result = await app.get(FunctionService).getAllFunctions(
				program.programId,
				{
					circleId: undefined,
					trigger: undefined,
					effectType: undefined,
				},
				{ skip: 0, take: 10 },
			);

			expect(result.getItems()).toHaveLength(2);
		});

		it('a provided trigger narrows the results', async () => {
			const program = await seedFunctions();

			const result = await app.get(FunctionService).getAllFunctions(
				program.programId,
				{
					circleId: undefined,
					trigger: triggerEnum.PURCHASE,
					effectType: undefined,
				},
				{ skip: 0, take: 10 },
			);

			expect(result.getItems()).toHaveLength(1);
		});
	});

	describe('LinkService.getAllLinks', () => {
		it("omitting the name filter returns all of the promoter's links", async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await createLink(dataSource, program, promoter, 'first-ref');
			await createLink(dataSource, program, promoter, 'second-ref');

			const links = await app
				.get(LinkService)
				.getAllLinks(program.programId, promoter.promoterId, {
					name: undefined,
				});

			expect(links).toHaveLength(2);
		});
	});
});
