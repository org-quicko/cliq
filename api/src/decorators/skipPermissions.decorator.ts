import { SetMetadata } from '@nestjs/common';

export const SKIP_PERMISSIONS_KEY = 'skip_permissions';
export const SkipPermissions = () => SetMetadata(SKIP_PERMISSIONS_KEY, true);
