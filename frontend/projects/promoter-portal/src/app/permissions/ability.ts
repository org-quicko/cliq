import { AbilityBuilder, createMongoAbility, MongoAbility, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { LinkDto, MemberDto, ReferralDto, CommissionDto, PromoterDto, memberRoleEnum, actionsType, PromoterMemberDto } from '@org.quicko.cliq/ngx-core';

export type subjectsType =
	InferSubjects<
		typeof LinkDto
		| typeof MemberDto
		| typeof ReferralDto
		| typeof CommissionDto
		| typeof PromoterDto
		| typeof PromoterMemberDto
		| 'PromoterStats'
	>
	| 'all';

export type MemberAbilityTuple = [actionsType, subjectsType];
export type MemberAbility = MongoAbility<MemberAbilityTuple>;

export function defineMemberAbilities(role: memberRoleEnum): MemberAbility {
	const { can: allow, cannot: forbid, build } = new AbilityBuilder<MemberAbility>(createMongoAbility);

	// Base permissions for all roles
	allow(['read', 'read_all'], [LinkDto, ReferralDto, CommissionDto, MemberDto, PromoterMemberDto]);

	forbid(['create', 'delete'], LinkDto).because('Only editors and admin can manage links');
	forbid('invite_member', PromoterMemberDto).because('Only editors and admin can add members');
	forbid('remove_member', PromoterMemberDto).because('Only admin can remove members');
	forbid('change_role', PromoterMemberDto).because('Only admin can change member role');
	forbid('update', PromoterDto).because('Only editors and admin can update promoter details');
	forbid('delete', PromoterDto).because('Only admin can delete promoter');

	if (role === memberRoleEnum.EDITOR) {
		allow('manage', LinkDto);
		allow('update', PromoterDto);
		allow('invite_member', PromoterMemberDto);

	} else if (role === memberRoleEnum.ADMIN) {
		allow('manage', [LinkDto, PromoterDto, PromoterMemberDto]);
	}

	return build({
		detectSubjectType: (item) => item.constructor as ExtractSubjectType<subjectsType>
	});
}
