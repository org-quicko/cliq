export const actions = [
    'manage',
    'create',
    'read',
    'read_all',
    'update',
    'delete',
    'invite_user',
    'invite_member',
    'remove_user',
    'leave',
    'remove_member',
    'include_promoter',
    'remove_promoter',
    'change_role',
    'operate_in',
    'register'
] as const;

export type actionsType = (typeof actions)[number];