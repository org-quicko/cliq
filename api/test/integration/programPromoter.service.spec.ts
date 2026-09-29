import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createProgram, createPromoter } from '../support/factories';
import { ProgramPromoterService } from '../../src/services/programPromoter.service';

/**
 * ProgramPromoterService.getProgramPromoter looks up a ProgramPromoter row by
 * the (programId, promoterId) pair together, not just by promoterId.
 */
describe('ProgramPromoterService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: ProgramPromoterService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(ProgramPromoterService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	it('returns the ProgramPromoter row for an associated pair', async () => {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);

		const result = await service.getProgramPromoter(
			program.programId,
			promoter.promoterId,
		);

		expect(result.programId).toBe(program.programId);
		expect(result.promoterId).toBe(promoter.promoterId);
		expect(result.acceptedTermsAndConditions).toBe(true);
	});

	it('throws BadRequestException when the promoter has no association at all', async () => {
		const { program } = await createProgram(dataSource);

		await expect(
			service.getProgramPromoter(
				program.programId,
				'00000000-0000-0000-0000-000000000000',
			),
		).rejects.toThrow(BadRequestException);
	});

	it('throws BadRequestException when the promoter belongs to a different program', async () => {
		const { program: programA, defaultCircle: circleA } =
			await createProgram(dataSource);
		const { program: programB } = await createProgram(dataSource);
		const { promoter } = await createPromoter(
			dataSource,
			programA,
			circleA,
		);

		await expect(
			service.getProgramPromoter(programB.programId, promoter.promoterId),
		).rejects.toThrow(BadRequestException);
	});
});
