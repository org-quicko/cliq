import {
	CanActivate,
	ExecutionContext,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../services/user.service';
import { MemberService } from '../services/member.service';
import { LoggerService } from '../services/logger.service';
import { audienceEnum } from 'src/enums/audience.enum';
import { ApiKeyGuard } from './apiKey.guard';
import { Reflector } from '@nestjs/core';
import { SKIP_PERMISSIONS_KEY } from 'src/decorators/skipPermissions.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private userService: UserService,
		private memberService: MemberService,

		private apiKeyGuard: ApiKeyGuard,

		private readonly reflector: Reflector,

		private logger: LoggerService,
	) { }

	async canActivate(context: ExecutionContext) {
		this.logger.info(`START: canActivate function - AuthGuard`);

		const request: Request = context.switchToHttp().getRequest();

		const skipPermissions = this.reflector.getAllAndOverride<boolean>(
			SKIP_PERMISSIONS_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (skipPermissions) return true;

		const key: string = request.headers['x-api-key'] as string;
		const secret: string = request.headers['x-api-secret'] as string;

		if (key && secret) {
			return this.apiKeyGuard.canActivate(context);
		}

		const authorization = request.headers.authorization;
		if (!authorization) {
			this.logger.error('Missing authentication token');
			throw new UnauthorizedException(
				'Missing authentication token',
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
					this.logger.info(`END: canActivate function - AuthGuard (authenticated user)`);
					return true;
				}
			} else {
				const member = await this.memberService.getMember(
					tokenPayload.sub as string,
				);
				if (member) {
					request.headers.member_id = member.memberId;
					this.logger.info(
						`END: canActivate function - AuthGuard (authenticated member)`,
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
