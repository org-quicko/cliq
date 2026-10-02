import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createProgram } from '../support/factories';
import { ProgramSummaryView } from '../../src/entities';
import { MaterializedViewRefreshService } from '../../src/services/materializedViewRefresh.service';

/**
 * program_summary_mv is a real materialized view: it only reflects new
 * programs once MaterializedViewRefreshService refreshes it (on
 * a cron in production, disabled here via REFRESH_MV_CRON).
 */
describe('MaterializedViewRefreshService', () => {
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

	it('picks up new programs on refresh', async () => {
		const { program } = await createProgram(dataSource);

		const summaries = dataSource.getRepository(ProgramSummaryView);
		expect(
			await summaries.findOneBy({ programId: program.programId }),
		).toBeNull();

		await app
			.get(MaterializedViewRefreshService)
			.refreshMaterializedViews();

		const summary = await summaries.findOneByOrFail({
			programId: program.programId,
		});
		expect(summary.programName).toBe(program.name);
		expect(Number(summary.totalReferrals)).toBe(0);
	});

	it('reports success for a known view and failure for an unknown one', async () => {
		const service = app.get(MaterializedViewRefreshService);

		await expect(service.refreshView('program_summary_mv')).resolves.toBe(
			true,
		);
		await expect(service.refreshView('does_not_exist_mv')).resolves.toBe(
			false,
		);
	});
});
