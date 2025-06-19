import { SetMetadata } from '@nestjs/common';
import { actionsType, subjectsType } from 'src/types';

export const CHECK_PERMISSIONS_KEY = 'check_permissions';
export const Permissions = (action: actionsType, subject: subjectsType) =>
	SetMetadata(CHECK_PERMISSIONS_KEY, [{ action, subject }]);
