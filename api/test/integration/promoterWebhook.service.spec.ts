import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createProgram, createPromoter } from '../support/factories';
import { PromoterWebhookService } from '../../src/services/promoterWebhook.service';
import { PromoterWebhook } from '../../src/entities';

/**
 * PromoterWebhookService scopes every operation to the (programId,
 * promoterId, webhookId) triple and rejects an event set that collides with
 * another webhook belonging to the same promoter.
 *
 * Issue 18 in issues.md: webhook secrets come back in plain text on create,
 * get and list. No test here encodes that as correct.
 */
describe('PromoterWebhookService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: PromoterWebhookService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(PromoterWebhookService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	describe('createPromoterWebhook', () => {
		it('persists url, events and secret scoped to the program and promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const dto = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'top-secret',
					events: ['signup', 'purchase'],
				},
			);

			expect(dto.url).toBe('https://example.com/hook');
			expect(dto.events).toEqual(['signup', 'purchase']);

			const stored = await dataSource
				.getRepository(PromoterWebhook)
				.findOneByOrFail({ webhookId: dto.webhookId });
			expect(stored.programId).toBe(program.programId);
			expect(stored.promoterId).toBe(promoter.promoterId);
			expect(stored.url).toBe('https://example.com/hook');
			expect(stored.secret).toBe('top-secret');
		});

		it('throws when a requested event is already claimed by another webhook for the same promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/first',
					secret: 'secret-1',
					events: ['signup'],
				},
			);

			await expect(
				service.createPromoterWebhook(
					program.programId,
					promoter.promoterId,
					{
						url: 'https://example.com/second',
						secret: 'secret-2',
						events: ['signup', 'purchase'],
					},
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('allows the same event when it belongs to a different promoter', async () => {
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

			await service.createPromoterWebhook(
				program.programId,
				promoterA.promoterId,
				{
					url: 'https://example.com/a',
					secret: 'secret-a',
					events: ['signup'],
				},
			);

			await expect(
				service.createPromoterWebhook(
					program.programId,
					promoterB.promoterId,
					{
						url: 'https://example.com/b',
						secret: 'secret-b',
						events: ['signup'],
					},
				),
			).resolves.toBeDefined();
		});
	});

	describe('getPromoterWebhook', () => {
		it('throws when the webhook belongs to a different promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter: owner } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: other } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				owner.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup'],
				},
			);

			await expect(
				service.getPromoterWebhook(
					program.programId,
					other.promoterId,
					created.webhookId,
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('returns the webhook when the triple matches', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup'],
				},
			);

			const fetched = await service.getPromoterWebhook(
				program.programId,
				promoter.promoterId,
				created.webhookId,
			);

			expect(fetched.webhookId).toBe(created.webhookId);
		});
	});

	describe('getAllPromoterWebhooks', () => {
		it('scopes results to the given program and promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter: owner } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: other } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.createPromoterWebhook(
				program.programId,
				owner.promoterId,
				{
					url: 'https://example.com/owner',
					secret: 'secret',
					events: ['signup'],
				},
			);
			await service.createPromoterWebhook(
				program.programId,
				other.promoterId,
				{
					url: 'https://example.com/other',
					secret: 'secret',
					events: ['signup'],
				},
			);

			const result = await service.getAllPromoterWebhooks(
				program.programId,
				owner.promoterId,
			);

			const items = result.getItems() ?? [];
			expect(items).toHaveLength(1);
			expect(items[0].url).toBe('https://example.com/owner');
		});

		it('paginates with skip and take', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/1',
					secret: 'secret',
					events: ['signup'],
				},
			);
			await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/2',
					secret: 'secret',
					events: ['purchase'],
				},
			);
			await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/3',
					secret: 'secret',
					events: ['refund'],
				},
			);

			const result = await service.getAllPromoterWebhooks(
				program.programId,
				promoter.promoterId,
				1,
				1,
			);

			expect(result.getItems()).toHaveLength(1);
			expect(result.getSkip()).toBe(1);
			expect(result.getTake()).toBe(1);
			expect(result.getCount()).toBe(3);
		});
	});

	describe('updatePromoterWebhook', () => {
		it('throws when the webhook does not exist in scope', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await expect(
				service.updatePromoterWebhook(
					program.programId,
					promoter.promoterId,
					'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
					{ url: 'https://example.com/new' },
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when the body has none of url, events or secret set', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup'],
				},
			);

			await expect(
				service.updatePromoterWebhook(
					program.programId,
					promoter.promoterId,
					created.webhookId,
					{},
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when events is an empty array', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup'],
				},
			);

			await expect(
				service.updatePromoterWebhook(
					program.programId,
					promoter.promoterId,
					created.webhookId,
					{ events: [] },
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when the new events collide with another webhook', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/first',
					secret: 'secret',
					events: ['signup'],
				},
			);
			const target = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/second',
					secret: 'secret',
					events: ['purchase'],
				},
			);

			await expect(
				service.updatePromoterWebhook(
					program.programId,
					promoter.promoterId,
					target.webhookId,
					{ events: ['signup'] },
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('does not throw when re-submitting its own current events', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup', 'purchase'],
				},
			);

			await expect(
				service.updatePromoterWebhook(
					program.programId,
					promoter.promoterId,
					created.webhookId,
					{ events: ['signup', 'purchase'] },
				),
			).resolves.not.toThrow();
		});

		it('persists a valid partial update', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup'],
				},
			);

			await service.updatePromoterWebhook(
				program.programId,
				promoter.promoterId,
				created.webhookId,
				{ url: 'https://example.com/updated' },
			);

			const stored = await dataSource
				.getRepository(PromoterWebhook)
				.findOneByOrFail({ webhookId: created.webhookId });
			expect(stored.url).toBe('https://example.com/updated');
			expect(stored.events).toEqual(['signup']);
		});
	});

	describe('deletePromoterWebhook', () => {
		it('throws when the webhook does not exist in scope', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await expect(
				service.deletePromoterWebhook(
					program.programId,
					promoter.promoterId,
					'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('removes the row when it exists', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const created = await service.createPromoterWebhook(
				program.programId,
				promoter.promoterId,
				{
					url: 'https://example.com/hook',
					secret: 'secret',
					events: ['signup'],
				},
			);

			await service.deletePromoterWebhook(
				program.programId,
				promoter.promoterId,
				created.webhookId,
			);

			const stored = await dataSource
				.getRepository(PromoterWebhook)
				.findOneBy({ webhookId: created.webhookId });
			expect(stored).toBeNull();
		});
	});
});
