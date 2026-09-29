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
import { ApiKeyService } from '../../src/services/apiKey.service';
import { ApiKey, Program, Promoter } from '../../src/entities';
import { statusEnum } from '../../src/enums';

/**
 * ApiKeyService issues, fetches and revokes program- and promoter-scoped API
 * keys. A program-level key is stored with `promoter_id IS NULL`; a
 * promoter-level key carries a `promoterId`. Both keys can coexist for the
 * same program because the lookups always branch on whether a promoterId was
 * given.
 *
 * Not covered here (see issues.md): generateKey never checks that a given
 * promoterId actually belongs to the program (issue 13), so no test asserts
 * cross-program scoping is enforced on issuance.
 */
describe('ApiKeyService', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let service: ApiKeyService;

	beforeAll(async () => {
		app = await createTestApp();
		dataSource = app.get(DataSource);
		service = app.get(ApiKeyService);
	});

	afterAll(async () => {
		await app?.close();
	});

	useIsolatedTransaction(() => dataSource);

	async function seedProgramWithPromoter() {
		const { program, defaultCircle } = await createProgram(dataSource);
		const { promoter } = await createPromoter(
			dataSource,
			program,
			defaultCircle,
		);
		return { program, promoter };
	}

	/** Inserts a key straight through the repository so its status can be set. */
	async function insertApiKey(
		program: Program,
		promoter: Promoter | null,
		secret: string,
		status: statusEnum,
	): Promise<ApiKey> {
		const repo = dataSource.getRepository(ApiKey);
		return repo.save(
			repo.create({
				key: `key-${program.programId}-${promoter?.promoterId ?? 'program'}`,
				secret,
				status,
				programId: program.programId,
				promoterId: promoter?.promoterId ?? null,
			}),
		);
	}

	describe('generateKey', () => {
		it('creating a program-level key replaces the existing one', async () => {
			const { program } = await seedProgramWithPromoter();

			const first = await service.generateKey(program.programId);
			const second = await service.generateKey(program.programId);

			expect(second.apiKeyId).not.toBe(first.apiKeyId);

			const repo = dataSource.getRepository(ApiKey);
			expect(
				await repo.findOneBy({ apiKeyId: first.apiKeyId }),
			).toBeNull();
			expect(await repo.countBy({ programId: program.programId })).toBe(
				1,
			);
		});

		it('creating a promoter-level key replaces the existing one for that promoter', async () => {
			const { program, promoter } = await seedProgramWithPromoter();

			const first = await service.generateKey(
				program.programId,
				promoter.promoterId,
			);
			const second = await service.generateKey(
				program.programId,
				promoter.promoterId,
			);

			expect(second.apiKeyId).not.toBe(first.apiKeyId);

			const repo = dataSource.getRepository(ApiKey);
			expect(
				await repo.findOneBy({ apiKeyId: first.apiKeyId }),
			).toBeNull();
			expect(
				await repo.countBy({
					programId: program.programId,
					promoterId: promoter.promoterId,
				}),
			).toBe(1);
		});

		it('a program-level key and a promoter-level key for the same program coexist', async () => {
			const { program, promoter } = await seedProgramWithPromoter();

			await service.generateKey(program.programId);
			await service.generateKey(program.programId, promoter.promoterId);

			const repo = dataSource.getRepository(ApiKey);
			expect(await repo.countBy({ programId: program.programId })).toBe(
				2,
			);
		});
	});

	describe('getKey', () => {
		it('returns the program-level key, distinct from a promoter-level key on the same program', async () => {
			const { program, promoter } = await seedProgramWithPromoter();

			const programKey = await service.generateKey(program.programId);
			await service.generateKey(program.programId, promoter.promoterId);

			const found = await service.getKey(program.programId);

			expect(found.apiKeyId).toBe(programKey.apiKeyId);
			expect(found.promoterId).toBeNull();
		});

		it('returns the promoter-level key when scoped by promoterId', async () => {
			const { program, promoter } = await seedProgramWithPromoter();

			await service.generateKey(program.programId);
			const promoterKey = await service.generateKey(
				program.programId,
				promoter.promoterId,
			);

			const found = await service.getKey(
				program.programId,
				promoter.promoterId,
			);

			expect(found.apiKeyId).toBe(promoterKey.apiKeyId);
			expect(found.promoterId).toBe(promoter.promoterId);
		});

		it('throws NotFoundException when no key exists for that scope', async () => {
			const { program } = await seedProgramWithPromoter();

			await expect(
				service.getKey(program.programId),
			).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('deleteKey', () => {
		it('throws BadRequestException when the key does not match the given scope', async () => {
			const { program, promoter } = await seedProgramWithPromoter();

			// Program-level key (promoterId is null on the row)...
			const key = await service.generateKey(program.programId);

			// ...but deleteKey is asked for it scoped to a promoter.
			await expect(
				service.deleteKey(
					program.programId,
					key.apiKeyId,
					promoter.promoterId,
				),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('removes the row when the key matches the given scope', async () => {
			const { program, promoter } = await seedProgramWithPromoter();

			const key = await service.generateKey(
				program.programId,
				promoter.promoterId,
			);

			await service.deleteKey(
				program.programId,
				key.apiKeyId,
				promoter.promoterId,
			);

			const repo = dataSource.getRepository(ApiKey);
			expect(await repo.findOneBy({ apiKeyId: key.apiKeyId })).toBeNull();
		});
	});

	describe('validateKeyAndSecret', () => {
		it('returns the ApiKey entity for a correct key/secret pair against an active key', async () => {
			const { program } = await seedProgramWithPromoter();
			const generated = await service.generateKey(program.programId);

			const result = await service.validateKeyAndSecret(
				generated.key,
				generated.secret!,
			);

			expect(result).not.toBeNull();
			expect(result?.apiKeyId).toBe(generated.apiKeyId);
		});

		it('returns null for a wrong secret', async () => {
			const { program } = await seedProgramWithPromoter();
			const generated = await service.generateKey(program.programId);

			const result = await service.validateKeyAndSecret(
				generated.key,
				'not-the-right-secret',
			);

			expect(result).toBeNull();
		});

		it('returns null when the key is not ACTIVE', async () => {
			const { program } = await seedProgramWithPromoter();
			const plainSecret = 'plain-secret-for-inactive-key';
			const inactive = await insertApiKey(
				program,
				null,
				plainSecret,
				statusEnum.INACTIVE,
			);

			const result = await service.validateKeyAndSecret(
				inactive.key,
				plainSecret,
			);

			expect(result).toBeNull();
		});
	});

	describe('keyExistsInProgram', () => {
		it('is true for a program-level key checked without a promoterId, and false when a promoterId is given', async () => {
			const { program, promoter } = await seedProgramWithPromoter();
			const key = await service.generateKey(program.programId);

			expect(
				await service.keyExistsInProgram(
					program.programId,
					key.apiKeyId,
				),
			).toBe(true);
			expect(
				await service.keyExistsInProgram(
					program.programId,
					key.apiKeyId,
					promoter.promoterId,
				),
			).toBe(false);
		});

		it('is true for a promoter-level key checked with its promoterId, and false without one', async () => {
			const { program, promoter } = await seedProgramWithPromoter();
			const key = await service.generateKey(
				program.programId,
				promoter.promoterId,
			);

			expect(
				await service.keyExistsInProgram(
					program.programId,
					key.apiKeyId,
					promoter.promoterId,
				),
			).toBe(true);
			expect(
				await service.keyExistsInProgram(
					program.programId,
					key.apiKeyId,
				),
			).toBe(false);
		});
	});
});
