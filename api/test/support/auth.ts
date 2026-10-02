import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ApiKey } from '../../src/entities/apiKey.entity';
import { Member } from '../../src/entities/member.entity';
import { User } from '../../src/entities/user.entity';
import { audienceEnum } from '../../src/enums/audience.enum';

/**
 * AuthGuard and PermissionsGuard are APP_GUARDs, so every request in an HTTP
 * test needs real credentials. These mint them the same way the running
 * system does.
 */

/** Signs a program-user token the way UserAuthService.loginUser does. */
export function userToken(app: INestApplication, user: User): string {
	return app.get(JwtService).sign({
		sub: user.userId,
		email: user.email,
		aud: audienceEnum.PROGRAM_USER,
	});
}

/** Signs a member token the way MemberAuthService.loginMember does. */
export function memberToken(app: INestApplication, member: Member): string {
	return app.get(JwtService).sign({
		sub: member.memberId,
		email: member.email,
		aud: audienceEnum.PROMOTER_USER,
	});
}

export function asUser(app: INestApplication, user: User): [string, string] {
	return ['Authorization', `Bearer ${userToken(app, user)}`];
}

export function asMember(
	app: INestApplication,
	member: Member,
): [string, string] {
	return ['Authorization', `Bearer ${memberToken(app, member)}`];
}

export interface ApiKeyCredentials {
	apiKeyId: string;
	key: string;
	secret: string;
}

/**
 * Inserts an API key and hands back the plaintext secret. The entity's
 * @BeforeInsert hook hashes `secret` on the way in, so the plaintext only
 * exists here. Pass `promoterId` for a promoter-scoped key.
 */
export async function createApiKeyCredentials(
	dataSource: DataSource,
	programId: string,
	promoterId?: string,
): Promise<ApiKeyCredentials> {
	const key = randomBytes(16).toString('hex');
	const secret = randomBytes(32).toString('hex');

	const repo = dataSource.getRepository(ApiKey);
	const saved = await repo.save(
		repo.create({ key, secret, programId, promoterId: promoterId ?? null }),
	);

	return { apiKeyId: saved.apiKeyId, key, secret };
}

/** Header pair AuthGuard routes to ApiKeyGuard on. */
export function apiKeyHeaders(
	credentials: ApiKeyCredentials,
): Record<string, string> {
	return {
		'x-api-key': credentials.key,
		'x-api-secret': credentials.secret,
	};
}
