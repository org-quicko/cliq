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
	const { can, cannot, build } = new AbilityBuilder<MemberAbility>(createMongoAbility);

	// Base permissions for all roles
	can(['read', 'read_all'], [LinkDto, ReferralDto, CommissionDto, MemberDto, PromoterMemberDto]);

	cannot(['create', 'delete'], LinkDto).because('Only editors and admin can manage links');
	cannot('invite_member', PromoterMemberDto).because('Only editors and admin can add members');
	cannot('remove_member', PromoterMemberDto).because('Only admin can remove members');
	cannot('change_role', PromoterMemberDto).because('Only admin can change member role');
	cannot('update', PromoterDto).because('Only editors and admin can update promoter details');
	cannot('delete', PromoterDto).because('Only admin can delete promoter');

	if (role === memberRoleEnum.EDITOR) {
		can('manage', LinkDto);
		can('update', PromoterDto);
		can('invite_member', PromoterMemberDto);

	} else if (role === memberRoleEnum.ADMIN) {
		can('manage', [LinkDto, PromoterDto, MemberDto]);
	}

	return build({
		detectSubjectType: (item) => item.constructor as ExtractSubjectType<subjectsType>
	});
}
