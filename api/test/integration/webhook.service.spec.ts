import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../support/test-app';
import { useIsolatedTransaction } from '../support/transaction';
import { createProgram } from '../support/factories';
import { WebhookService } from '../../src/services/webhook.service';
import { Webhook } from '../../src/entities';
import { CreateWebhookDto, UpdateWebhookDto } from '../../src/dtos';

/**
 * WebhookService's duplicate-event check (checkEventDuplicates) is scoped by
 * `{ programId }` alone, with no promoter dimension: unlike
 * PromoterWebhookService, a program-level webhook only ever collides with
 * another webhook in the SAME program.
 */
describe('WebhookService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: WebhookService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(WebhookService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	const createDto = (overrides: Partial<CreateWebhookDto> = {}) =>
		({
			url: 'https://example.com/hook',
			secret: 'shh-its-a-secret',
			events: ['commission.created'],
			...overrides,
		}) as CreateWebhookDto;

	describe('createWebhook', () => {
		it('persists url/events/secret scoped to the program', async () => {
			const { program } = await createProgram(dataSource);

			const webhookDto = await service.createWebhook(
				program.programId,
				createDto({
					events: ['commission.created', 'purchase.created'],
				}),
			);

			const stored = await dataSource
				.getRepository(Webhook)
				.findOneByOrFail({ webhookId: webhookDto.webhookId });
			expect(stored.programId).toBe(program.programId);
			expect(stored.url).toBe('https://example.com/hook');
			expect(stored.secret).toBe('shh-its-a-secret');
			expect(stored.events).toEqual([
				'commission.created',
				'purchase.created',
			]);
		});

		it('throws when an event is already claimed by another webhook in the same program', async () => {
			const { program } = await createProgram(dataSource);
			await service.createWebhook(
				program.programId,
				createDto({ events: ['commission.created'] }),
			);

			await expect(
				service.createWebhook(
					program.programId,
					createDto({
						events: ['commission.created', 'purchase.created'],
					}),
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('succeeds when the same event is used by a webhook in a different program', async () => {
			const { program: programA } = await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);
			await service.createWebhook(
				programA.programId,
				createDto({ events: ['commission.created'] }),
			);

			await expect(
				service.createWebhook(
					programB.programId,
					createDto({ events: ['commission.created'] }),
				),
			).resolves.toBeDefined();
		});
	});

	describe('getWebhook', () => {
		it('throws when the webhookId does not exist in the program', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.getWebhook(
					program.programId,
					'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when the webhook belongs to a different program', async () => {
			const { program: programA } = await createProgram(dataSource);
			const { program: programB } = await createProgram(dataSource);
			const webhookDto = await service.createWebhook(
				programA.programId,
				createDto(),
			);

			await expect(
				service.getWebhook(programB.programId, webhookDto.webhookId),
			).rejects.toBeInstanceOf(BadRequestException);
		});
	});

	describe('getAllWebhooks', () => {
		it('scopes results to the program and paginates with skip/take', async () => {
			const { program } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);

			await service.createWebhook(
				program.programId,
				createDto({ events: ['event.one'] }),
			);
			await service.createWebhook(
				program.programId,
				createDto({ events: ['event.two'] }),
			);
			await service.createWebhook(
				program.programId,
				createDto({ events: ['event.three'] }),
			);
			await service.createWebhook(
				otherProgram.programId,
				createDto({ events: ['event.one'] }),
			);

			const firstPage = await service.getAllWebhooks(
				program.programId,
				0,
				2,
			);
			expect(firstPage.getItems()).toHaveLength(2);
			expect(firstPage.getCount()).toBe(3);
			expect(firstPage.getSkip()).toBe(0);
			expect(firstPage.getTake()).toBe(2);

			const secondPage = await service.getAllWebhooks(
				program.programId,
				2,
				2,
			);
			expect(secondPage.getItems()).toHaveLength(1);

			const bodies = JSON.stringify(firstPage.getItems());
			expect(bodies).not.toContain(otherProgram.programId);
		});
	});

	describe('updateWebhook', () => {
		it('throws when the webhook does not exist in the program', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.updateWebhook(
					program.programId,
					'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
					{ url: 'https://example.com/new' } as UpdateWebhookDto,
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when none of url/events/secret is set', async () => {
			const { program } = await createProgram(dataSource);
			const webhookDto = await service.createWebhook(
				program.programId,
				createDto(),
			);

			await expect(
				service.updateWebhook(
					program.programId,
					webhookDto.webhookId,
					{} as UpdateWebhookDto,
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when events is an empty array', async () => {
			const { program } = await createProgram(dataSource);
			const webhookDto = await service.createWebhook(
				program.programId,
				createDto(),
			);

			await expect(
				service.updateWebhook(program.programId, webhookDto.webhookId, {
					events: [],
				} as UpdateWebhookDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('throws when the new events collide with another webhook in the program', async () => {
			const { program } = await createProgram(dataSource);
			await service.createWebhook(
				program.programId,
				createDto({ events: ['commission.created'] }),
			);
			const target = await service.createWebhook(
				program.programId,
				createDto({ events: ['purchase.created'] }),
			);

			await expect(
				service.updateWebhook(program.programId, target.webhookId, {
					events: ['commission.created'],
				} as UpdateWebhookDto),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('does not throw when resubmitting the webhook’s own current events', async () => {
			const { program } = await createProgram(dataSource);
			const target = await service.createWebhook(
				program.programId,
				createDto({
					events: ['commission.created', 'purchase.created'],
				}),
			);

			await expect(
				service.updateWebhook(program.programId, target.webhookId, {
					events: ['commission.created', 'purchase.created'],
				} as UpdateWebhookDto),
			).resolves.not.toThrow();
		});

		it('persists a valid partial update', async () => {
			const { program } = await createProgram(dataSource);
			const target = await service.createWebhook(
				program.programId,
				createDto(),
			);

			await service.updateWebhook(program.programId, target.webhookId, {
				url: 'https://example.com/updated',
			} as UpdateWebhookDto);

			const stored = await dataSource
				.getRepository(Webhook)
				.findOneByOrFail({ webhookId: target.webhookId });
			expect(stored.url).toBe('https://example.com/updated');
			expect(stored.secret).toBe('shh-its-a-secret');
		});
	});

	describe('deleteWebhook', () => {
		it('throws when the webhook does not exist in the program', async () => {
			const { program } = await createProgram(dataSource);

			await expect(
				service.deleteWebhook(
					program.programId,
					'3f2504e0-4f89-11d3-9a0c-0305e82c3301',
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('removes the row when it exists in the program', async () => {
			const { program } = await createProgram(dataSource);
			const target = await service.createWebhook(
				program.programId,
				createDto(),
			);

			await service.deleteWebhook(program.programId, target.webhookId);

			const stored = await dataSource
				.getRepository(Webhook)
				.findOneBy({ webhookId: target.webhookId });
			expect(stored).toBeNull();
		});
	});
});
