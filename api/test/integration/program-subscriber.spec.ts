import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	addUserToProgram,
	createProgram,
	createUser,
	seedSuperAdmin,
} from '../support/factories';
import { Program, ProgramUser } from '../../src/entities';
import { userRoleEnum } from '../../src/enums';

/**
 * ProgramSubscriber provisions the platform super admin into every new
 * program and cleans up program memberships when a program is removed.
 */
describe('ProgramSubscriber', () => {
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

	it('adds the platform super admin to a newly inserted program', async () => {
		const superAdmin = await seedSuperAdmin(dataSource);

		const { program } = await createProgram(dataSource);

		const membership = await dataSource
			.getRepository(ProgramUser)
			.findOneBy({
				programId: program.programId,
				userId: superAdmin.userId,
			});
		expect(membership?.role).toBe(userRoleEnum.SUPER_ADMIN);
	});

	it("removing a program drops only that program's memberships", async () => {
		const user = await createUser(dataSource);
		const { program: removed } = await createProgram(dataSource);
		const { program: kept } = await createProgram(dataSource);
		await addUserToProgram(dataSource, user, removed, userRoleEnum.ADMIN);
		await addUserToProgram(dataSource, user, kept, userRoleEnum.ADMIN);

		const programRepo = dataSource.getRepository(Program);
		await programRepo.remove(
			await programRepo.findOneByOrFail({ programId: removed.programId }),
		);

		const memberships = dataSource.getRepository(ProgramUser);
		expect(
			await memberships.countBy({ programId: removed.programId }),
		).toBe(0);
		// Two rows: the super admin (added by afterInsert) and `user`.
		expect(await memberships.countBy({ programId: kept.programId })).toBe(
			2,
		);
	});
});
