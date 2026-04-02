import { AbilityBuilder, createMongoAbility, MongoAbility, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { ApiKeyDto, LinkDto, MemberDto, ReferralDto, CommissionDto, PromoterDto, PromoterWebhookDto, memberRoleEnum, actionsType, PromoterMemberDto } from '@org.quicko.cliq/ngx-core';

export type subjectsType =
	InferSubjects<
		typeof ApiKeyDto
		| typeof LinkDto
		| typeof MemberDto
		| typeof ReferralDto
		| typeof CommissionDto
		| typeof PromoterDto
		| typeof PromoterMemberDto
		| typeof PromoterWebhookDto
		| 'PromoterStats'
	>
	| 'all';

export type MemberAbilityTuple = [actionsType, subjectsType];
export type MemberAbility = MongoAbility<MemberAbilityTuple>;

export function defineMemberAbilities(role: memberRoleEnum): MemberAbility {
	const { can: allow, cannot: forbid, build } = new AbilityBuilder<MemberAbility>(createMongoAbility);

	// Base permissions for all roles
	allow(['read', 'read_all'], [LinkDto, ReferralDto, CommissionDto, MemberDto, PromoterMemberDto, PromoterWebhookDto]);
	allow('read', ApiKeyDto);

	forbid(['create', 'delete'], LinkDto).because('Only editors and admin can manage links');
	forbid(['invite_member', 'remove_member'], PromoterMemberDto).because('Only admin can add or remove members');
	forbid('change_role', PromoterMemberDto).because('Only admin can change member role');
	forbid('update', PromoterDto).because('Only editors and admin can update promoter details');
	forbid('delete', PromoterDto).because('Only admin can delete promoter');
	forbid('manage', ApiKeyDto).because('Only admin can manage API keys');

	if (role === memberRoleEnum.EDITOR) {
		allow('manage', [LinkDto, PromoterWebhookDto]);
		allow('update', PromoterDto);

	} else if (role === memberRoleEnum.ADMIN) {
		allow('manage', [LinkDto, PromoterDto, PromoterMemberDto, ApiKeyDto, PromoterWebhookDto]);
	}

	return build({
		detectSubjectType: (item) => item.constructor as ExtractSubjectType<subjectsType>
	});
}
