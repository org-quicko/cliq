import { BadRequestException, CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ForbiddenError } from '@casl/ability';
import {
	AppAbility,
	AuthorizationService,
} from '../services/authorization.service';
import { CHECK_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { LoggerService } from '../services/logger.service';
import { MemberService } from '../services/member.service';
import { UserService } from '../services/user.service';
import { actionsType, subjectsType } from 'src/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private reflector: Reflector,

		private userService: UserService,

		private authorizationService: AuthorizationService,

		private memberService: MemberService,

		private logger: LoggerService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.get<{ action: actionsType; subject: subjectsType }[]>(CHECK_PERMISSIONS_KEY, context.getHandler());

		if (!requiredPermissions) {
			return true; // No permissions required, allow access
		}

		const request: Request = context.switchToHttp().getRequest();
		const user_id = request.headers.user_id as string;
		const member_id = request.headers.member_id as string;
		const api_key_id = request.headers.api_key_id as string;
		
		
		let entityType: 'User' | 'Member' | 'Api User';

		if (!member_id && !user_id && !api_key_id) {
			return false;
		}

		let ability: AppAbility;
		if (member_id) {
			// Generate member's ability
			const memberEntity =
				await this.memberService.getMemberEntity(member_id);
			if (!memberEntity) {
				return false;
			}
			ability = this.authorizationService.getMemberAbility(memberEntity);
			entityType = 'Member';
		}
		else if (api_key_id) {
			ability = this.authorizationService.getApiUserAbility(request.headers.program_id as string);
			entityType = 'Api User';
		}
		else {
			const userEntity = await this.userService.getUserEntity(user_id);
			if (!userEntity) {
				return false;
			}

			// Generate user's ability
			ability = this.authorizationService.getUserAbility(userEntity);
			entityType = 'User';
		}

		try {
			const subjectObjects = await this.authorizationService.getSubjects(
				entityType,
				request,
				requiredPermissions,
			);

			for (let i = 0; i < requiredPermissions.length; i++) {
				const action = requiredPermissions[i].action;
				const subjectObject = subjectObjects[i];
				
				console.log('\n\n', action, subjectObjects[i], '\n\n');

				if (!subjectObject) {
					this.logger.error(`${entityType} does not have permission to perform this action!`);
					throw new ForbiddenError(ability);
				}

				ForbiddenError.from(ability).throwUnlessCan(
					action,
					subjectObject,
				);
			}

			return true;
		} catch (error) {
			if (error instanceof NotFoundException) {
				this.logger.warn(error.message);
				throw error;
			}
			if (error instanceof BadRequestException) {
				this.logger.error(error.message);
				throw error;
			}
			else if (error instanceof ForbiddenError) {
				this.logger.error(`${entityType} does not have permission to perform this action!`);
			}
			else if (error instanceof Error) {
				this.logger.error(`Error: `, error.message);
			}
			return false;
		}
	}
}
