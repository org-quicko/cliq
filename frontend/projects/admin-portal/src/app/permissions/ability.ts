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
	userRoleEnum,
	actionsType,
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
		| 'ProgramSummaryMv'
		| 'PromoterAnalyticsView'
		| 'Webhook'
	>
	| 'all';

export type UserAbilityTuple = [actionsType, subjectsType];
export type UserAbility = MongoAbility<UserAbilityTuple>;

/**
 * Define abilities for admin portal users based on their role
 * This mirrors the backend getUserAbility function from authorization.service.ts
 */
export function defineUserAbilities(role: userRoleEnum, programId?: string, programRole?: userRoleEnum): UserAbility {
	const { can: allow, cannot: forbid, build } = new AbilityBuilder<UserAbility>(createMongoAbility);


	if (role === userRoleEnum.SUPER_ADMIN) {
		allow('manage', 'all');
		return build({
			detectSubjectType: (item) => item.constructor as ExtractSubjectType<subjectsType>
		});
	}

	allow('read_all', ProgramDto);


	allow(['read', 'update', 'delete'], UserDto);
	allow('leave', ProgramDto);


	if (programId && programRole) {

		allow('read', ProgramDto);
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
		]);
		allow(['read', 'read_all'], ProgramUserDto);

		if (programRole === userRoleEnum.ADMIN || programRole === userRoleEnum.SUPER_ADMIN) {

			allow(['update', 'invite_user'], ProgramDto);
			allow('manage', PromoterDto);
			allow('manage', [LinkDto, CircleDto, FunctionDto, ApiKeyDto, 'Webhook']);


			allow(['change_role', 'remove_user', 'invite_user'], ProgramUserDto);

		} else if (programRole === userRoleEnum.EDITOR) {

			allow('manage', [LinkDto, CircleDto, FunctionDto]);

		}

	}


	forbid('read_all', 'ProgramSummaryMv').because('Only super admins can access program summary');

	return build({
		detectSubjectType: (item) => item.constructor as ExtractSubjectType<subjectsType>
	});
}
