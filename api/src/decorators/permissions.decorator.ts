import { SetMetadata } from '@nestjs/common';
import { actionsType, subjectsType } from '../services/role.service';

export const CHECK_USER_PERMISSIONS_KEY = 'check_user_permissions';
export const UserPermissions = (action: actionsType, subject: subjectsType, programId?: string) =>
    SetMetadata(CHECK_USER_PERMISSIONS_KEY, [{ action, subject, programId }]);

export const CHECK_PERMISSIONS_KEY = 'check_permissions';
export const Permissions = (action: actionsType, subject: subjectsType) =>
    SetMetadata(CHECK_PERMISSIONS_KEY, [{ action, subject }]);

export const CHECK_MEMBER_PERMISSIONS_KEY = 'check_member_permissions';
export const MemberPermissions = (action: actionsType, subject: subjectsType, programId?: string, promoterId?: string) =>
    SetMetadata(CHECK_MEMBER_PERMISSIONS_KEY, [{ action, subject, programId, promoterId }]);