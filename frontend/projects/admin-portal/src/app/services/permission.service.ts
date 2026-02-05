import { computed, inject, Injectable, signal } from '@angular/core';
import { AbilityServiceSignal } from '@casl/angular';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';
import { defineUserAbilities, UserAbility } from '../permissions/ability';

@Injectable({ providedIn: 'root' })
export class PermissionsService {

	private readonly abilityService = inject(AbilityServiceSignal<UserAbility>);

	// Signal to track current user's global role
	private readonly _userRole = signal<userRoleEnum | null>(null);
	readonly userRole = this._userRole.asReadonly();

	// Signal to track current program context
	private readonly _currentProgramId = signal<string | null>(null);
	private readonly _currentProgramRole = signal<userRoleEnum | null>(null);

	readonly currentProgramId = this._currentProgramId.asReadonly();
	readonly currentProgramRole = this._currentProgramRole.asReadonly();

	// Computed signal to check if user is super admin
	readonly isSuperAdmin = computed(() => this._userRole() === userRoleEnum.SUPER_ADMIN);

	// Computed signal to check if user has admin role in current program
	readonly isAdmin = computed(() => {
		const programRole = this._currentProgramRole();
		return programRole === userRoleEnum.ADMIN || programRole === userRoleEnum.SUPER_ADMIN;
	});

	/**
	 * Set user's global role and update abilities
	 * Called after login or when user data is fetched
	 */
	setUserRole(role: userRoleEnum) {
		this._userRole.set(role);
		this.updateAbilities();
	}

	/**
	 * Set the current program context with user's role in that program
	 * Called when navigating to a specific program
	 */
	setProgramContext(programId: string, programRole: userRoleEnum) {
		this._currentProgramId.set(programId);
		this._currentProgramRole.set(programRole);
		this.updateAbilities();
	}

	/**
	 * Clear program context (e.g., when navigating away from a program)
	 */
	clearProgramContext() {
		this._currentProgramId.set(null);
		this._currentProgramRole.set(null);
		this.updateAbilities();
	}

	/**
	 * Clear all permissions (e.g., on logout)
	 */
	clearPermissions() {
		this._userRole.set(null);
		this._currentProgramId.set(null);
		this._currentProgramRole.set(null);
		this.abilityService.update([]);
	}

	/**
	 * Update CASL abilities based on current user role and program context
	 */
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
