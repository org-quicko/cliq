import { SetMetadata } from '@nestjs/common';
import { actionsType, subjectsType } from '../services/authorization.service';

export const CHECK_PERMISSIONS_KEY = 'check_permissions';
export const Permissions = (action: actionsType, subject: subjectsType) =>
    SetMetadata(CHECK_PERMISSIONS_KEY, [{ action, subject }]);