import { computed, inject, Injectable, signal } from '@angular/core';
import { AbilityServiceSignal } from '@casl/angular';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities, UserAbility } from '../permissions/ability';

@Injectable({ providedIn: 'root' })
export class PermissionsService {

	private readonly abilityService = inject(AbilityServiceSignal<UserAbility>);

	private readonly _userRole = signal<userRoleEnum | null>(null);
	readonly userRole = this._userRole.asReadonly();

	readonly isSuperAdmin = computed(() => this._userRole() === userRoleEnum.SUPER_ADMIN);

	setUserRole(role: userRoleEnum) {
		this._userRole.set(role);
		this.updateAbilities();
	}

	setAbilityForRole(role: userRoleEnum) {
		this._userRole.set(role);
		const ability = defineUserAbilities(role);
		this.abilityService.update(ability.rules);
	}

	clearPermissions() {
		this._userRole.set(null);
		this.abilityService.update([]);
	}

	private updateAbilities() {
		const role = this._userRole();
		if (!role) {
			this.abilityService.update([]);
			return;
		}

		const ability = defineUserAbilities(role);
		this.abilityService.update(ability.rules);
	}
}
