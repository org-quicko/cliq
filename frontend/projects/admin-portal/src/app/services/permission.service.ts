import { computed, inject, Injectable, signal } from '@angular/core';
import { AbilityServiceSignal } from '@casl/angular';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities, UserAbility } from '../permissions/ability';

@Injectable({ providedIn: 'root' })
export class PermissionsService {

	private readonly abilityService = inject(AbilityServiceSignal<UserAbility>);


	private readonly _userRole = signal<userRoleEnum | null>(null);
	readonly userRole = this._userRole.asReadonly();


	private readonly _currentProgramId = signal<string | null>(null);
	private readonly _currentProgramRole = signal<userRoleEnum | null>(null);

	readonly currentProgramId = this._currentProgramId.asReadonly();
	readonly currentProgramRole = this._currentProgramRole.asReadonly();


	readonly isSuperAdmin = computed(() => this._userRole() === userRoleEnum.SUPER_ADMIN);


	readonly isAdmin = computed(() => {
		const programRole = this._currentProgramRole();
		return programRole === userRoleEnum.ADMIN || programRole === userRoleEnum.SUPER_ADMIN;
	});


	setUserRole(role: userRoleEnum) {
		this._userRole.set(role);
		this.updateAbilities();
	}

	setProgramContext(programId: string, programRole: userRoleEnum) {
		this._currentProgramId.set(programId);
		this._currentProgramRole.set(programRole);
		this.updateAbilities();
	}

	clearProgramContext() {
		this._currentProgramId.set(null);
		this._currentProgramRole.set(null);
		this.updateAbilities();
	}

	
	clearPermissions() {
		this._userRole.set(null);
		this._currentProgramId.set(null);
		this._currentProgramRole.set(null);
		this.abilityService.update([]);
	}

	
	private updateAbilities() {
		const role = this._userRole();
		if (!role) {
			this.abilityService.update([]);
			return;
		}

		const ability = defineUserAbilities(
			role,
			this._currentProgramId() ?? undefined,
			this._currentProgramRole() ?? undefined
		);
		this.abilityService.update(ability.rules);
	}
}
