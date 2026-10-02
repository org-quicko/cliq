import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
	INestApplication,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import {
	createLink,
	createProgram,
	createPromoter,
} from '../support/factories';
import { LinkService } from '../../src/services/link.service';
import { Link } from '../../src/entities';
import { linkStatusEnum } from '../../src/enums';
import { CreateLinkDto } from '../../src/dtos';

const createDto = (overrides: Partial<CreateLinkDto> = {}): CreateLinkDto =>
	({
		name: 'Test link',
		refVal: 'ref-val',
		...overrides,
	}) as CreateLinkDto;

describe('LinkService (integration)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: LinkService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(LinkService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	describe('createLink', () => {
		it('throws ConflictException when a link with the same ref_val already exists in the same program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await createLink(dataSource, program, promoter, 'dup-ref');

			await expect(
				service.createLink(
					program.programId,
					promoter.promoterId,
					createDto({ refVal: 'dup-ref' }),
				),
			).rejects.toBeInstanceOf(ConflictException);
		});

		it('allows the same ref_val to be reused in a different program', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { promoter: promoterA } = await createPromoter(
				dataSource,
				programA,
				circleA,
			);
			await createLink(dataSource, programA, promoterA, 'shared-ref');

			const { program: programB, defaultCircle: circleB } =
				await createProgram(dataSource);
			const { promoter: promoterB } = await createPromoter(
				dataSource,
				programB,
				circleB,
			);

			await expect(
				service.createLink(
					programB.programId,
					promoterB.promoterId,
					createDto({ refVal: 'shared-ref' }),
				),
			).resolves.toBeDefined();
		});

		it('persists the program and promoter associations and returns a workbook payload', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const result = await service.createLink(
				program.programId,
				promoter.promoterId,
				createDto({ name: 'My Link', refVal: 'my-ref' }),
			);

			const body = JSON.stringify(result);
			expect(body).toContain('my-ref');
			expect(body).toContain('My Link');

			const stored = await dataSource
				.getRepository(Link)
				.findOneByOrFail({ refVal: 'my-ref' });
			expect(stored.programId).toBe(program.programId);
			expect(stored.promoterId).toBe(promoter.promoterId);
		});
	});

	describe('getAllLinks', () => {
		it('only returns links with ACTIVE status', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await createLink(dataSource, program, promoter, 'active-ref');
			const archived = await createLink(
				dataSource,
				program,
				promoter,
				'archived-ref',
			);
			await dataSource
				.getRepository(Link)
				.update(
					{ linkId: archived.linkId },
					{ status: linkStatusEnum.ARCHIVED },
				);

			const links = await service.getAllLinks(
				program.programId,
				promoter.promoterId,
			);

			expect(links).toHaveLength(1);
			expect(JSON.stringify(links)).toContain('active-ref');
			expect(JSON.stringify(links)).not.toContain('archived-ref');
		});

		it('throws NotFoundException when the promoter has zero active links', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await expect(
				service.getAllLinks(program.programId, promoter.promoterId),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getLinkEntity', () => {
		it('throws NotFoundException for an unknown link id', async () => {
			await expect(
				service.getLinkEntity('3f2504e0-4f89-11d3-9a0c-0305e82c3301'),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('returns the entity with the requested relations for a known link id', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'entity-ref',
			);

			const result = await service.getLinkEntity(link.linkId, {
				program: true,
				promoter: true,
			});

			expect(result.linkId).toBe(link.linkId);
			expect(result.program).toBeDefined();
			expect(result.program.programId).toBe(program.programId);
			expect(result.promoter).toBeDefined();
			expect(result.promoter.promoterId).toBe(promoter.promoterId);
		});
	});

	describe('getLink', () => {
		it('throws NotFoundException for a link id that does not exist', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await expect(
				service.getLink(
					program.programId,
					promoter.promoterId,
					'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('getLinkEntityByRefVal', () => {
		it('finds the link scoped to ref_val and program_id', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'scoped-ref',
			);

			const result = await service.getLinkEntityByRefVal(
				'scoped-ref',
				program.programId,
			);

			expect(result.linkId).toBe(link.linkId);
		});

		it('throws NotFoundException when the ref_val exists under a different program', async () => {
			const { program: programA, defaultCircle: circleA } =
				await createProgram(dataSource);
			const { promoter: promoterA } = await createPromoter(
				dataSource,
				programA,
				circleA,
			);
			await createLink(
				dataSource,
				programA,
				promoterA,
				'cross-program-ref',
			);

			const { program: programB } = await createProgram(dataSource);

			await expect(
				service.getLinkEntityByRefVal(
					'cross-program-ref',
					programB.programId,
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('merges extra whereOptions, excluding an archived link with the same ref_val and program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'archived-scoped-ref',
			);
			await dataSource
				.getRepository(Link)
				.update(
					{ linkId: link.linkId },
					{ status: linkStatusEnum.ARCHIVED },
				);

			await expect(
				service.getLinkEntityByRefVal(
					'archived-scoped-ref',
					program.programId,
					{ status: linkStatusEnum.ACTIVE },
				),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('deleteLink', () => {
		it('soft-deletes by setting status to ARCHIVED rather than removing the row', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const link = await createLink(
				dataSource,
				program,
				promoter,
				'to-delete',
			);

			await service.deleteLink(
				program.programId,
				promoter.promoterId,
				link.linkId,
			);

			const stored = await dataSource
				.getRepository(Link)
				.findOneByOrFail({ linkId: link.linkId });
			expect(stored.status).toBe(linkStatusEnum.ARCHIVED);
		});
	});

	describe('linkExists', () => {
		it('returns true when no such link exists', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.linkExists('no-such-ref', program.programId),
			).resolves.toBe(true);
		});

		it('returns false when a link with that ref_val and program already exists', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			await createLink(dataSource, program, promoter, 'existing-ref');

			await expect(
				service.linkExists('existing-ref', program.programId),
			).resolves.toBe(false);
		});
	});
});
