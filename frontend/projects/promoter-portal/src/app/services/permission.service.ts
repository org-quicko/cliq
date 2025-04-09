import { computed, inject, Injectable, signal } from '@angular/core';
import { createMongoAbility } from '@casl/ability';
import { actionsType, memberRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineMemberAbilities, MemberAbility, subjectsType } from '../permissions/ability';
import { AbilityServiceSignal } from '@casl/angular';

@Injectable({ providedIn: 'root' })
export class PermissionsService {

	private readonly abilityService = inject(AbilityServiceSignal<MemberAbility>);

	setAbilityForRole(role: memberRoleEnum) {
		const ability = defineMemberAbilities(role);
		this.abilityService.update(ability.rules);
	}


}
