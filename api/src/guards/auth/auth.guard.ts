import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyService } from '../../services/apiKey.service';
import { UserService } from '../../services/user.service';
import { MemberService } from '../../services/member.service';
import { LoggerService } from '../../services/logger.service';
import { audienceEnum } from 'src/enums/audience.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private apiKeyService: ApiKeyService,
		private userService: UserService,
		private memberService: MemberService,
		private logger: LoggerService,
	) {}

	async canActivate(context: ExecutionContext) {
		this.logger.info(`START: canActivate function - AuthApiKeyGuard`);

		const request: Request = context.switchToHttp().getRequest();

		const key: string = request.headers['x-api-key'] as string;
		const secret: string = request.headers['x-api-secret'] as string;

		if (key && secret) {
			const apiKey = await this.apiKeyService.validateKeyAndSecret(
				key,
				secret,
			);
			if (apiKey) {
				request.headers.api_key_id = apiKey.apiKeyId;
				request.headers.program_id = apiKey.programId;
				this.logger.info(
					`END: canActivate function - AuthApiKeyGuard (authenticated via API Key)`,
				);
				return true;
			}
			this.logger.error('Invalid API key or secret.');
			throw new UnauthorizedException('Invalid API key or secret.');
		}

		const authorization = request.headers.authorization;
		if (!authorization) {
			this.logger.error('Missing authentication token and API key');
			throw new UnauthorizedException(
				'Missing authentication token and API key',
			);
		}

		const token = authorization.split(' ')[1];
		if (!token) {
			this.logger.error('Invalid token format');
			throw new UnauthorizedException('Invalid token format');
		}

		try {
			const tokenPayload = await this.jwtService.verifyAsync(token);

			if (tokenPayload.aud === audienceEnum.PROGRAM_USER) {
				const user = await this.userService.getUser(
					tokenPayload.sub as string,
				);
				if (user) {
					request.headers.user_id = user.userId;
					this.logger.info(`END: canActivate function - AuthApiKeyGuard (authenticated user)`);
					return true;
				}
			} else {
				const member = await this.memberService.getMember(
					tokenPayload.sub as string,
				);
				if (member) {
					request.headers.member_id = member.memberId;
					this.logger.info(
						`END: canActivate function - AuthApiKeyGuard (authenticated member)`,
					);
					return true;
				}
			}

			this.logger.error('Invalid credentials');
			throw new UnauthorizedException('Invalid credentials');
		} catch (error) {
			this.logger.error('Authentication failed');
			if (error instanceof Error) {
				throw new UnauthorizedException('Authentication failed');
			}
			throw error;
		}
	}
}
