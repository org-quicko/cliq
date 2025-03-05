import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '@casl/ability';
import { actionsType, AppAbility, RoleService, subjectsType } from '../../services/role.service';
import { CHECK_PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { LoggerService } from '../../services/logger.service';
import { MemberService } from '../../services/member.service';
import { MemberLoginData } from '../../services/memberAuth.service';
import { UserService } from 'src/services/user.service';
import { UserLoginData } from 'src/services/userAuth.service';

@Injectable()
export class UnifiedPermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,

        private userService: UserService,

        private roleService: RoleService,

        private memberService: MemberService,

        private logger: LoggerService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions =
            this.reflector.get<{ action: actionsType; subject: subjectsType }[]>(
                CHECK_PERMISSIONS_KEY,
                context.getHandler(),
            );

        if (!requiredPermissions) {
            return true; // No permissions required, allow access
        }


        const request = context.switchToHttp().getRequest();
        const user: UserLoginData = request.user;
        const member: MemberLoginData = request.member; // AuthGuard already sets `request.member`

        if (!member) {
            if (!user) {
                return false; // Shouldn't happen since AuthGuard ensures member is set
            }
        }

        let ability: AppAbility;
        if (member) {
            const memberEntity = await this.memberService.getMemberByEmail(member.email);
            if (!memberEntity) {
                return false; // Shouldn't happen since AuthGuard ensures member is set
            }
            ability = this.roleService.createForMember(memberEntity);
        } else if (user) {
            const userEntity = await this.userService.getUserByEmail(user.email);
            if (!userEntity) {
                return false; // Shouldn't happen since AuthGuard ensures user is set
            }

            // Generate user's ability
            ability = this.roleService.createForUser(userEntity);
        } else {
            ability = this.roleService.createEmpty();
        }

        // Generate member's ability


        try {
            const subjectObjects = await this.roleService.getSubjects(request, requiredPermissions);

            for (let i = 0; i < requiredPermissions.length; i++) {
                const action = requiredPermissions[i].action;
                
                console.log('\n\n', action, subjectObjects[i], '\n\n');
                ForbiddenError.from(ability).throwUnlessCan(action, subjectObjects[i]);
            }

            return true;
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Member does not have permission to perform this action!`);
            }
            return false;
        }
    }
}
