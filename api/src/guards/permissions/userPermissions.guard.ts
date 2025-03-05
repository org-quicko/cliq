import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '@casl/ability';
import { actionsType, RoleService, subjectsType } from '../../services/role.service';
import { CHECK_USER_PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { LoggerService } from 'src/services/logger.service';
import { UserService } from '../../services/user.service';
import { UserLoginData } from '../../services/userAuth.service';

@Injectable()

export class UserPermissionsGuard implements CanActivate {

    constructor(
        private reflector: Reflector,

        private roleService: RoleService,

        private userService: UserService,

        private logger: LoggerService,

    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const requiredPermissions =
            this.reflector.get<{ action: actionsType; subject: subjectsType }[]>(
                CHECK_USER_PERMISSIONS_KEY,
                context.getHandler(),
            );

        if (!requiredPermissions) {
            return true; // No permissions required, allow access
        }


        const request = context.switchToHttp().getRequest();
        const user: UserLoginData = request.user; // AuthGuard already sets request.user

        if (!user) {
            if (request.member) return true; // if user is a member, allow further checking by member guard
            return false; // Shouldn't happen since AuthGuard ensures user is set
        }

        const userEntity = await this.userService.getUserByEmail(user.email);
        if (!userEntity) {
            return false; // Shouldn't happen since AuthGuard ensures user is set
        }

        // Generate user's ability
        const ability = this.roleService.createForUser(userEntity);

        try {
            const subjectObjects = await this.roleService.getSubjects(request, requiredPermissions);

            for (let i = 0; i < requiredPermissions.length; i++) {
                const action = requiredPermissions[i].action;
                
                ForbiddenError.from(ability).throwUnlessCan(action, subjectObjects[i]);
            }

            return true;
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(`User does not have permission to perform this action!`);
            }
            return false;
        }

    }

}