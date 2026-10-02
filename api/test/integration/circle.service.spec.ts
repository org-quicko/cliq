import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	INestApplication,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createProgram, createPromoter } from '../support/factories';
import { CircleService } from '../../src/services/circle.service';
import { Circle, CirclePromoter } from '../../src/entities';

/** Syntactically valid but never-inserted id, for "doesn't exist" cases. */
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

describe('CircleService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: CircleService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(CircleService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	describe('createCircle', () => {
		it('throws NotFoundException when the program does not exist', async () => {
			// createCircle's own `if (!programResult)` branch is unreachable:
			// ProgramService.getProgram throws NotFoundException itself before
			// ever returning a falsy value.
			await expect(
				service.createCircle(NON_EXISTENT_ID, {
					name: 'Orphan Circle',
				}),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('persists isDefaultCircle and scopes the circle to the given program', async () => {
			const { program } = await createProgram(dataSource);

			const created = await service.createCircle(program.programId, {
				name: 'Regional Circle',
				isDefaultCircle: true,
			});

			const stored = await dataSource
				.getRepository(Circle)
				.findOneByOrFail({ circleId: created.circleId });

			expect(stored.programId).toBe(program.programId);
			expect(stored.isDefaultCircle).toBe(true);
			expect(stored.name).toBe('Regional Circle');
		});
	});

	describe('getAllCircles', () => {
		it('filters by name (ILike, partial and case-insensitive), scoped to the program', async () => {
			const { program } = await createProgram(dataSource);
			const circleRepo = dataSource.getRepository(Circle);
			await circleRepo.save(
				circleRepo.create({ name: 'Alpha Circle', program }),
			);
			await circleRepo.save(
				circleRepo.create({ name: 'Beta Circle', program }),
			);

			const { program: otherProgram } = await createProgram(dataSource);
			await circleRepo.save(
				circleRepo.create({
					name: 'Alpha Circle',
					program: otherProgram,
				}),
			);

			const result = await service.getAllCircles(
				program.programId,
				'alpha',
			);

			const body = JSON.stringify(result);
			expect(body).toContain('Alpha Circle');
			expect(body).not.toContain('Beta Circle');
			expect(
				result.getCircleSheet().getCircleTable().getRows(),
			).toHaveLength(1);
		});

		it('paginates with skip/take and reports the total in metadata', async () => {
			const { program } = await createProgram(dataSource);
			const circleRepo = dataSource.getRepository(Circle);
			await circleRepo.save(
				circleRepo.create({ name: 'Circle B', program }),
			);
			await circleRepo.save(
				circleRepo.create({ name: 'Circle C', program }),
			);
			await circleRepo.save(
				circleRepo.create({ name: 'Circle D', program }),
			);
			// Plus the DEFAULT_CIRCLE created alongside the program: 4 total.

			const firstPage = await service.getAllCircles(
				program.programId,
				undefined,
				0,
				2,
			);
			expect(
				firstPage.getCircleSheet().getCircleTable().getRows(),
			).toHaveLength(2);
			expect(firstPage.getMetadata().getNumber('total')).toBe(4);

			const secondPage = await service.getAllCircles(
				program.programId,
				undefined,
				2,
				2,
			);
			expect(
				secondPage.getCircleSheet().getCircleTable().getRows(),
			).toHaveLength(2);
		});
	});

	describe('addPromoters', () => {
		it('adds each promoter id as a circle_promoter row', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter: promoterA } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: promoterB } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const targetCircle = await dataSource
				.getRepository(Circle)
				.save(
					dataSource
						.getRepository(Circle)
						.create({ name: 'Target Circle', program }),
				);

			await service.addPromoters(targetCircle.circleId, {
				promoters: [promoterA.promoterId, promoterB.promoterId],
			});

			const rows = await dataSource
				.getRepository(CirclePromoter)
				.find({ where: { circleId: targetCircle.circleId } });
			expect(rows.map((r) => r.promoterId).sort()).toEqual(
				[promoterA.promoterId, promoterB.promoterId].sort(),
			);
		});

		// CirclePromoter's primary key is the (circle_id, promoter_id) pair
		// (circlePromoter.entity.ts). One might expect re-adding the same
		// promoter to violate that constraint, but `.create()` sets both
		// primary-key columns before `.save()` runs, so TypeORM treats it as an
		// upsert (a SELECT to decide INSERT vs UPDATE) rather than a blind
		// INSERT — the second call is a silent no-op, not a constraint error.
		it('adding the same promoter twice is a no-op, not a constraint violation', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const targetCircle = await dataSource
				.getRepository(Circle)
				.save(
					dataSource
						.getRepository(Circle)
						.create({ name: 'Target Circle', program }),
				);

			await service.addPromoters(targetCircle.circleId, {
				promoters: [promoter.promoterId],
			});

			await expect(
				service.addPromoters(targetCircle.circleId, {
					promoters: [promoter.promoterId],
				}),
			).resolves.not.toThrow();

			const rows = await dataSource
				.getRepository(CirclePromoter)
				.find({ where: { circleId: targetCircle.circleId } });
			expect(rows).toHaveLength(1);
		});
	});

	describe('getCircle', () => {
		it('throws NotFoundException for a circle id that does not exist', async () => {
			await expect(
				service.getCircle(NON_EXISTENT_ID),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getCircleEntity', () => {
		it('throws NotFoundException for a circle id that does not exist', async () => {
			await expect(
				service.getCircleEntity(NON_EXISTENT_ID),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('circleExists', () => {
		it('is true only when both the program and circle match', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);

			expect(
				await service.circleExists(
					programA.programId,
					circleA.circleId,
				),
			).toBe(true);
			expect(
				await service.circleExists(
					programB.programId,
					circleA.circleId,
				),
			).toBe(false);
			expect(
				await service.circleExists(programA.programId, NON_EXISTENT_ID),
			).toBe(false);
		});
	});

	describe('updateCircle', () => {
		it('throws NotFoundException when the circle does not exist', async () => {
			await expect(
				service.updateCircle(NON_EXISTENT_ID, { name: 'New Name' }),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('persists a field update', async () => {
			const { defaultCircle } = await createProgram(dataSource);

			await service.updateCircle(defaultCircle.circleId, {
				name: 'Renamed Circle',
			});

			const stored = await dataSource
				.getRepository(Circle)
				.findOneByOrFail({ circleId: defaultCircle.circleId });
			expect(stored.name).toBe('Renamed Circle');
		});
	});

	describe('deleteCircle', () => {
		it('removes a circle that has no dependents', async () => {
			const { program } = await createProgram(dataSource);
			const circleRepo = dataSource.getRepository(Circle);
			const circle = await circleRepo.save(
				circleRepo.create({ name: 'Disposable Circle', program }),
			);

			await service.deleteCircle(circle.circleId);

			expect(
				await circleRepo.findOneBy({ circleId: circle.circleId }),
			).toBeNull();
		});
	});

	describe('removePromoter', () => {
		it('throws BadRequestException when the circle/promoter relation does not exist', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const otherCircle = await dataSource
				.getRepository(Circle)
				.save(
					dataSource
						.getRepository(Circle)
						.create({ name: 'Other Circle', program }),
				);

			await expect(
				service.removePromoter(
					otherCircle.circleId,
					promoter.promoterId,
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('removes an existing relation', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.removePromoter(
				defaultCircle.circleId,
				promoter.promoterId,
			);

			const remaining = await dataSource
				.getRepository(CirclePromoter)
				.countBy({
					circleId: defaultCircle.circleId,
					promoterId: promoter.promoterId,
				});
			expect(remaining).toBe(0);
		});
	});

	describe('promoterExistsInCircle', () => {
		it('reports true only for an actual relation', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const otherCircle = await dataSource
				.getRepository(Circle)
				.save(
					dataSource
						.getRepository(Circle)
						.create({ name: 'Other Circle', program }),
				);

			expect(
				await service.promoterExistsInCircle(
					defaultCircle.circleId,
					promoter.promoterId,
				),
			).toBe(true);
			expect(
				await service.promoterExistsInCircle(
					otherCircle.circleId,
					promoter.promoterId,
				),
			).toBe(false);
		});
	});

	describe('switchPromoterCircle', () => {
		it('moves a promoter from one circle to another', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const targetCircle = await dataSource
				.getRepository(Circle)
				.save(
					dataSource
						.getRepository(Circle)
						.create({ name: 'Target Circle', program }),
				);

			await service.switchPromoterCircle({
				promoterId: promoter.promoterId,
				programId: program.programId,
				currentCircleId: defaultCircle.circleId,
				targetCircleId: targetCircle.circleId,
			});

			const circlePromoterRepo = dataSource.getRepository(CirclePromoter);
			expect(
				await circlePromoterRepo.countBy({
					circleId: defaultCircle.circleId,
					promoterId: promoter.promoterId,
				}),
			).toBe(0);
			expect(
				await circlePromoterRepo.countBy({
					circleId: targetCircle.circleId,
					promoterId: promoter.promoterId,
				}),
			).toBe(1);
		});

		// The method wraps `this.datasource.transaction(...)` in try/catch but
		// returns that promise instead of awaiting it (circle.service.ts:333),
		// so a rejection from inside the transaction — the BadRequestException
		// below — is never seen by the local catch: it propagates straight to
		// the caller rather than being logged and swallowed.
		it('rejects instead of swallowing when the relation does not exist', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const targetCircle = await dataSource
				.getRepository(Circle)
				.save(
					dataSource
						.getRepository(Circle)
						.create({ name: 'Target Circle', program }),
				);

			await expect(
				service.switchPromoterCircle({
					promoterId: promoter.promoterId,
					programId: program.programId,
					// The promoter is actually in `defaultCircle`, not here.
					currentCircleId: targetCircle.circleId,
					targetCircleId: defaultCircle.circleId,
				}),
			).rejects.toBeInstanceOf(BadRequestException);
		});
	});
});
