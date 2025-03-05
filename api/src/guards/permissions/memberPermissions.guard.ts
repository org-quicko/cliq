import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenError } from '@casl/ability';
import { actionsType, RoleService, subjectsType } from '../../services/role.service';
import { CHECK_MEMBER_PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { LoggerService } from '../../services/logger.service';
import { MemberService } from '../../services/member.service';
import { MemberLoginData } from '../../services/memberAuth.service';
import { Member } from 'src/entities';
// import { PromoterMemberService } from '../../services/promoterMember.service';

@Injectable()
export class MemberPermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,

        private roleService: RoleService,

        private memberService: MemberService,

        private logger: LoggerService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions =
            this.reflector.get<{ action: actionsType; subject: subjectsType }[]>(
                CHECK_MEMBER_PERMISSIONS_KEY,
                context.getHandler(),
            );

        if (!requiredPermissions) {
            return true; // No permissions required, allow access
        }

        console.log('HERE', requiredPermissions);

        const request = context.switchToHttp().getRequest();
        const member: MemberLoginData = request.member; // AuthGuard already sets `request.member`

        if (!member) {
            if (request.user) return true; // if user is a member, allow further checking by member guard
            return false; // Shouldn't happen since AuthGuard ensures member is set
        }

        const memberEntity = await this.memberService.getMemberByEmail(member.email);
        if (!memberEntity) {
            return false; // Shouldn't happen since AuthGuard ensures member is set
        }
        
        // Generate member's ability
        const ability = this.roleService.createForMember(memberEntity);

        
        try {
            const subjectObjects = await this.roleService.getSubjects(request, requiredPermissions);

            for (let i = 0; i < requiredPermissions.length; i++) {
                const action = requiredPermissions[i].action;
                
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
