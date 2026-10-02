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
import {
	addUserToProgram,
	createMember,
	createProgram,
	createPromoter,
	createUser,
} from '../support/factories';
import {
	CirclePromoter,
	Member,
	ProgramPromoter,
	Promoter,
	PromoterMember,
} from '../../src/entities';
import {
	memberRoleEnum,
	promoterStatusEnum,
	statusEnum,
	userRoleEnum,
	visibilityEnum,
} from '../../src/enums';

/**
 * The promoter lifecycle from the portal: a member creates a promoter (and
 * becomes its admin), registers it for the program by accepting the T&Cs,
 * then reads, updates and eventually deletes it. Authorization comes from
 * AuthorizationService: members act on the promoters they belong to, by
 * role; program admins manage promoters; API keys are scoped to their
 * program, or to one promoter.
 */
describe('promoters (e2e)', () => {
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

	const promotersUrl = (programId: string) =>
		`/api/programs/${programId}/promoters`;
	const promoterUrl = (programId: string, promoterId: string) =>
		`${promotersUrl(programId)}/${promoterId}`;

	describe('POST /programs/:program_id/promoters', () => {
		it('makes the creating member the admin of an unregistered promoter', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			const response = await request(app.getHttpServer())
				.post(promotersUrl(program.programId))
				.set(...asMember(app, member))
				.send({
					name: 'Acme',
					logo_url: 'https://example.com/logo.png',
				})
				.expect(201);

			const promoter = response.body.data as { promoter_id: string };
			expect(promoter).toMatchObject({
				name: 'Acme',
				logo_url: 'https://example.com/logo.png',
				status: promoterStatusEnum.ACTIVE,
				accepted_terms_and_conditions: false,
			});
			expect(typeof promoter.promoter_id).toBe('string');

			const membership = await dataSource
				.getRepository(PromoterMember)
				.findOneByOrFail({ promoterId: promoter.promoter_id });
			expect(membership.memberId).toBe(member.memberId);
			expect(membership.role).toBe(memberRoleEnum.ADMIN);

			// Not part of the program until it registers.
			await request(app.getHttpServer())
				.get(promoterUrl(program.programId, promoter.promoter_id))
				.set(...asMember(app, member))
				.expect(404);
		});

		it('refuses a member who already belongs to a promoter in the program, leaving no orphan promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			const response = await request(app.getHttpServer())
				.post(promotersUrl(program.programId))
				.set(...asMember(app, member))
				.send({ name: 'Second promoter' });

			expect(response.status).toBe(401);
			expect(
				await dataSource
					.getRepository(Promoter)
					.countBy({ name: 'Second promoter' }),
			).toBe(0);
		});

		it('lets a program admin create a promoter with no members', async () => {
			const { program } = await createProgram(dataSource);
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);

			const response = await request(app.getHttpServer())
				.post(promotersUrl(program.programId))
				.set(...asUser(app, admin))
				.send({ name: 'Admin-made' })
				.expect(201);

			expect(
				await dataSource
					.getRepository(PromoterMember)
					.countBy({ promoterId: response.body.data.promoter_id }),
			).toBe(0);
		});

		it('rejects an undeclared property', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			await request(app.getHttpServer())
				.post(promotersUrl(program.programId))
				.set(...asMember(app, member))
				.send({ name: 'Acme', status: promoterStatusEnum.ARCHIVED })
				.expect(400);
		});

		it('requires a name', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);

			await request(app.getHttpServer())
				.post(promotersUrl(program.programId))
				.set(...asMember(app, member))
				.send({})
				.expect(400);
		});

		it('401s without credentials', async () => {
			const { program } = await createProgram(dataSource);

			await request(app.getHttpServer())
				.post(promotersUrl(program.programId))
				.send({ name: 'Acme' })
				.expect(401);
		});
	});

	describe('POST /programs/:program_id/promoters/:promoter_id/register', () => {
		/** A member-created promoter that has not joined the program yet. */
		async function unregisteredPromoter(programId: string, member: Member) {
			const response = await request(app.getHttpServer())
				.post(promotersUrl(programId))
				.set(...asMember(app, member))
				.send({ name: 'Acme' })
				.expect(201);
			return response.body.data.promoter_id as string;
		}

		it('joins the program and its default circle once the T&Cs are accepted', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);
			const promoterId = await unregisteredPromoter(
				program.programId,
				member,
			);

			const response = await request(app.getHttpServer())
				.post(`${promoterUrl(program.programId, promoterId)}/register`)
				.set(...asMember(app, member))
				.send({ accepted_terms_and_conditions: true })
				.expect(201);

			expect(response.body.data).toMatchObject({
				promoter_id: promoterId,
				accepted_terms_and_conditions: true,
			});

			const programPromoter = await dataSource
				.getRepository(ProgramPromoter)
				.findOneByOrFail({ programId: program.programId, promoterId });
			expect(programPromoter.acceptedTermsAndConditions).toBe(true);
			expect(
				await dataSource
					.getRepository(CirclePromoter)
					.countBy({ promoterId, circleId: defaultCircle.circleId }),
			).toBe(1);

			const fetched = await request(app.getHttpServer())
				.get(promoterUrl(program.programId, promoterId))
				.set(...asMember(app, member))
				.expect(200);
			expect(fetched.body.data.accepted_terms_and_conditions).toBe(true);
		});

		it('409s when the promoter has already joined', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.post(
					`${promoterUrl(program.programId, promoter.promoterId)}/register`,
				)
				.set(...asMember(app, member))
				.send({ accepted_terms_and_conditions: true })
				.expect(409);
		});

		it('records a rejection without placing the promoter in a circle', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);
			const promoterId = await unregisteredPromoter(
				program.programId,
				member,
			);

			const response = await request(app.getHttpServer())
				.post(`${promoterUrl(program.programId, promoterId)}/register`)
				.set(...asMember(app, member))
				.send({ accepted_terms_and_conditions: false })
				.expect(201);

			expect(response.body.data.accepted_terms_and_conditions).toBe(
				false,
			);
			expect(
				await dataSource
					.getRepository(CirclePromoter)
					.countBy({ promoterId }),
			).toBe(0);

			// Links stay locked until the T&Cs are accepted.
			await request(app.getHttpServer())
				.post(`${promoterUrl(program.programId, promoterId)}/links`)
				.set(...asMember(app, member))
				.send({ name: 'Blocked', ref_val: 'blocked' })
				.expect(400);
		});

		it('refuses to register with a private program', async () => {
			const { program } = await createProgram(dataSource, {
				visibility: visibilityEnum.PRIVATE,
			});
			const member = await createMember(dataSource, program);
			const promoterId = await unregisteredPromoter(
				program.programId,
				member,
			);

			await request(app.getHttpServer())
				.post(`${promoterUrl(program.programId, promoterId)}/register`)
				.set(...asMember(app, member))
				.send({ accepted_terms_and_conditions: true })
				.expect(400);

			expect(
				await dataSource
					.getRepository(ProgramPromoter)
					.countBy({ promoterId }),
			).toBe(0);
		});

		it('requires accepted_terms_and_conditions', async () => {
			const { program } = await createProgram(dataSource);
			const member = await createMember(dataSource, program);
			const promoterId = await unregisteredPromoter(
				program.programId,
				member,
			);

			await request(app.getHttpServer())
				.post(`${promoterUrl(program.programId, promoterId)}/register`)
				.set(...asMember(app, member))
				.send({})
				.expect(400);
		});

		it.each([memberRoleEnum.EDITOR, memberRoleEnum.VIEWER])(
			'is reserved for promoter admins (%s gets 403)',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter, member } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
					{
						memberRole: role,
					},
				);

				await request(app.getHttpServer())
					.post(
						`${promoterUrl(program.programId, promoter.promoterId)}/register`,
					)
					.set(...asMember(app, member))
					.send({ accepted_terms_and_conditions: true })
					.expect(403);
			},
		);
	});

	describe('GET /programs/:program_id/promoters/:promoter_id', () => {
		it.each(Object.values(memberRoleEnum))(
			'returns the promoter to its own %s',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter, member } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
					{
						name: 'Readable',
						memberRole: role,
					},
				);

				const response = await request(app.getHttpServer())
					.get(promoterUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.expect(200);

				expect(response.body.data).toMatchObject({
					promoter_id: promoter.promoterId,
					name: 'Readable',
					status: promoterStatusEnum.ACTIVE,
					accepted_terms_and_conditions: true,
				});
			},
		);

		it('404s when the promoter is not part of the program in the path', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { program: otherProgram } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.get(promoterUrl(otherProgram.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.expect(404);
		});

		it('lets a program admin read a promoter of their program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);

			const response = await request(app.getHttpServer())
				.get(promoterUrl(program.programId, promoter.promoterId))
				.set(...asUser(app, admin))
				.expect(200);

			expect(response.body.data.promoter_id).toBe(promoter.promoterId);
		});
	});

	describe('PATCH /programs/:program_id/promoters/:promoter_id', () => {
		it.each([memberRoleEnum.ADMIN, memberRoleEnum.EDITOR])(
			'lets a promoter %s update name and logo',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter, member } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
					{
						memberRole: role,
					},
				);

				const response = await request(app.getHttpServer())
					.patch(promoterUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.send({
						name: 'Renamed',
						logo_url: 'https://example.com/new.png',
					})
					.expect(200);

				expect(response.body.data).toMatchObject({
					name: 'Renamed',
					logo_url: 'https://example.com/new.png',
					accepted_terms_and_conditions: true,
				});
				const stored = await dataSource
					.getRepository(Promoter)
					.findOneByOrFail({ promoterId: promoter.promoterId });
				expect(stored.name).toBe('Renamed');
				expect(stored.logoUrl).toBe('https://example.com/new.png');
			},
		);

		it('403s for a promoter viewer', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					name: 'Original',
					memberRole: memberRoleEnum.VIEWER,
				},
			);

			await request(app.getHttpServer())
				.patch(promoterUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.send({ name: 'Renamed' })
				.expect(403);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(stored.name).toBe('Original');
		});

		it('lets a program admin update a promoter of their program', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const admin = await createUser(dataSource);
			await addUserToProgram(
				dataSource,
				admin,
				program,
				userRoleEnum.ADMIN,
			);

			const response = await request(app.getHttpServer())
				.patch(promoterUrl(program.programId, promoter.promoterId))
				.set(...asUser(app, admin))
				.send({ name: 'Renamed by admin' })
				.expect(200);

			expect(response.body.data.name).toBe('Renamed by admin');
		});

		it('rejects an undeclared property', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.patch(promoterUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.send({ status: promoterStatusEnum.ARCHIVED })
				.expect(400);
		});
	});

	describe('DELETE /programs/:program_id/promoters/:promoter_id', () => {
		it('archives the promoter and removes its sole admin', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);

			await request(app.getHttpServer())
				.delete(promoterUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.expect(200);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(stored.status).toBe(promoterStatusEnum.ARCHIVED);
			expect(
				await dataSource
					.getRepository(Member)
					.countBy({ memberId: member.memberId }),
			).toBe(0);
		});

		it('400s while the promoter has other members', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { promoter, member } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const colleague = await createMember(dataSource, program);
			await dataSource.getRepository(PromoterMember).save({
				promoterId: promoter.promoterId,
				memberId: colleague.memberId,
				role: memberRoleEnum.VIEWER,
				status: statusEnum.ACTIVE,
			});

			await request(app.getHttpServer())
				.delete(promoterUrl(program.programId, promoter.promoterId))
				.set(...asMember(app, member))
				.expect(400);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: promoter.promoterId });
			expect(stored.status).toBe(promoterStatusEnum.ACTIVE);
		});

		it.each([memberRoleEnum.EDITOR, memberRoleEnum.VIEWER])(
			'is reserved for promoter admins (%s gets 403)',
			async (role) => {
				const { program, defaultCircle } =
					await createProgram(dataSource);
				const { promoter, member } = await createPromoter(
					dataSource,
					program,
					defaultCircle,
					{
						memberRole: role,
					},
				);

				await request(app.getHttpServer())
					.delete(promoterUrl(program.programId, promoter.promoterId))
					.set(...asMember(app, member))
					.expect(403);

				const stored = await dataSource
					.getRepository(Promoter)
					.findOneByOrFail({ promoterId: promoter.promoterId });
				expect(stored.status).toBe(promoterStatusEnum.ACTIVE);
			},
		);
	});

	/**
	 * A member's ability only names the promoters they belong to, so the
	 * admin of promoter A gets nowhere with promoter B, even inside the same
	 * program.
	 */
	describe('tenant isolation between promoters', () => {
		async function twoPromoters() {
			const { program, defaultCircle } = await createProgram(dataSource);
			const home = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const foreign = await createPromoter(
				dataSource,
				program,
				defaultCircle,
				{
					name: 'Foreign',
				},
			);
			return { program, home, foreign };
		}

		it('cannot read another promoter', async () => {
			const { program, home, foreign } = await twoPromoters();

			await request(app.getHttpServer())
				.get(
					promoterUrl(program.programId, foreign.promoter.promoterId),
				)
				.set(...asMember(app, home.member))
				.expect(403);
		});

		it('cannot update another promoter as its own admin', async () => {
			const { program, home, foreign } = await twoPromoters();

			await request(app.getHttpServer())
				.patch(
					promoterUrl(program.programId, foreign.promoter.promoterId),
				)
				.set(...asMember(app, home.member))
				.send({ name: 'Hijacked' })
				.expect(403);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: foreign.promoter.promoterId });
			expect(stored.name).toBe('Foreign');
		});

		it('cannot delete another promoter', async () => {
			const { program, home, foreign } = await twoPromoters();

			await request(app.getHttpServer())
				.delete(
					promoterUrl(program.programId, foreign.promoter.promoterId),
				)
				.set(...asMember(app, home.member))
				.expect(403);

			const stored = await dataSource
				.getRepository(Promoter)
				.findOneByOrFail({ promoterId: foreign.promoter.promoterId });
			expect(stored.status).toBe(promoterStatusEnum.ACTIVE);
		});

		it('cannot register another promoter', async () => {
			const { program: otherProgram } = await createProgram(dataSource);
			const { home, foreign } = await twoPromoters();

			await request(app.getHttpServer())
				.post(
					`${promoterUrl(otherProgram.programId, foreign.promoter.promoterId)}/register`,
				)
				.set(...asMember(app, home.member))
				.send({ accepted_terms_and_conditions: true })
				.expect(403);
		});

		it('loses access to its own promoter once removed (inactive)', async () => {
			const { program, home } = await twoPromoters();
			await dataSource
				.getRepository(PromoterMember)
				.update(
					{ memberId: home.member.memberId },
					{ status: statusEnum.INACTIVE },
				);

			await request(app.getHttpServer())
				.get(promoterUrl(program.programId, home.promoter.promoterId))
				.set(...asMember(app, home.member))
				.expect(403);
		});
	});

	describe('API keys', () => {
		it('scopes a promoter key to reading its own promoter', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const own = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const sibling = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
				own.promoter.promoterId,
			);

			const response = await request(app.getHttpServer())
				.get(promoterUrl(program.programId, own.promoter.promoterId))
				.set(apiKeyHeaders(credentials))
				.expect(200);
			expect(response.body.data.promoter_id).toBe(
				own.promoter.promoterId,
			);

			await request(app.getHttpServer())
				.get(
					promoterUrl(program.programId, sibling.promoter.promoterId),
				)
				.set(apiKeyHeaders(credentials))
				.expect(403);

			await request(app.getHttpServer())
				.patch(promoterUrl(program.programId, own.promoter.promoterId))
				.set(apiKeyHeaders(credentials))
				.send({ name: 'Renamed by key' })
				.expect(403);
		});

		it('lets a program key read and update promoters of its program only', async () => {
			const { program, defaultCircle } = await createProgram(dataSource);
			const { program: otherProgram, defaultCircle: otherCircle } =
				await createProgram(dataSource);
			const { promoter } = await createPromoter(
				dataSource,
				program,
				defaultCircle,
			);
			const { promoter: foreign } = await createPromoter(
				dataSource,
				otherProgram,
				otherCircle,
			);
			const credentials = await createApiKeyCredentials(
				dataSource,
				program.programId,
			);

			await request(app.getHttpServer())
				.get(promoterUrl(program.programId, promoter.promoterId))
				.set(apiKeyHeaders(credentials))
				.expect(200);

			const updated = await request(app.getHttpServer())
				.patch(promoterUrl(program.programId, promoter.promoterId))
				.set(apiKeyHeaders(credentials))
				.send({ name: 'Renamed by key' })
				.expect(200);
			expect(updated.body.data.name).toBe('Renamed by key');

			await request(app.getHttpServer())
				.get(promoterUrl(otherProgram.programId, foreign.promoterId))
				.set(apiKeyHeaders(credentials))
				.expect(403);

			await request(app.getHttpServer())
				.patch(promoterUrl(otherProgram.programId, foreign.promoterId))
				.set(apiKeyHeaders(credentials))
				.send({ name: 'Hijacked' })
				.expect(403);
		});
	});
});
