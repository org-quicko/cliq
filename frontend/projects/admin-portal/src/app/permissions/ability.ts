import { AbilityBuilder, createMongoAbility, MongoAbility, ExtractSubjectType, InferSubjects } from '@casl/ability';
import {
  ProgramDto,
  ProgramUserDto,
  PromoterDto,
  LinkDto,
  CircleDto,
  FunctionDto,
  ReferralDto,
  CommissionDto,
  SignUpDto,
  PurchaseDto,
  ApiKeyDto,
  UserDto,
  UpdateUserRoleDto,
  userRoleEnum,
  actionsType
} from '@org.quicko.cliq/ngx-core';

export type subjectsType =
  InferSubjects<
    | typeof ProgramDto
    | typeof ProgramUserDto
    | typeof PromoterDto
    | typeof LinkDto
    | typeof CircleDto
    | typeof FunctionDto
    | typeof ReferralDto
    | typeof CommissionDto
    | typeof SignUpDto
    | typeof PurchaseDto
    | typeof ApiKeyDto
    | typeof UserDto
    | typeof UpdateUserRoleDto
    | 'ProgramSummaryMv'
    | 'PromoterAnalyticsView'
    | 'Webhook'
  >
  | 'all';

export type UserAbilityTuple = [actionsType, subjectsType];
export type UserAbility = MongoAbility<UserAbilityTuple>;

export function defineUserAbilities(role: userRoleEnum): UserAbility {

  const { can: allow, cannot: forbid, build } =
    new AbilityBuilder<UserAbility>(createMongoAbility);

  if (role === userRoleEnum.SUPER_ADMIN) {
    allow('manage', 'all');
    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<subjectsType>
    });
  }

  allow('read_all', ProgramDto);

  allow(['read', 'read_all'], [
    ReferralDto,
    'PromoterAnalyticsView',
    PromoterDto,
    LinkDto,
    CircleDto,
    FunctionDto,
    'Webhook',
    ApiKeyDto,
    CommissionDto,
    SignUpDto,
    PurchaseDto,
    ProgramUserDto
  ]);

  allow(['read', 'update', 'delete'], UserDto);
  allow('leave', ProgramDto);


  if (role === userRoleEnum.ADMIN) {

    allow(['update', 'delete', 'invite_user'], ProgramDto);

    allow('manage', PromoterDto);

    allow('manage', [LinkDto, CircleDto, FunctionDto, ApiKeyDto, 'Webhook']);

    allow(['change_role', 'remove_user', 'invite_user'], ProgramUserDto);

    allow(['change_role', 'remove_user', 'invite_user'], UpdateUserRoleDto);

  }


  if (role === userRoleEnum.EDITOR) {
    allow('manage', [LinkDto, CircleDto, FunctionDto]);
  }

  forbid('read_all', 'ProgramSummaryMv')
    .because('Only super admins can access program summary');

  return build({
    detectSubjectType: (item) =>
      item.constructor as ExtractSubjectType<subjectsType>
  });
}