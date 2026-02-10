import { Component, computed, effect, inject, Type, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DynamicComponentDirective } from '../../directives/dynamic-component.directive';
import { UserStore } from '../../store/user.store';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-dynamic-component-loader',
	standalone: true,
	imports: [MatProgressSpinnerModule, DynamicComponentDirective],
	templateUrl: './dynamic-component-loader.component.html',
	styleUrl: './dynamic-component-loader.component.css',
})
export class DynamicComponentLoaderComponent implements AfterViewInit {
	@ViewChild(DynamicComponentDirective, { static: false })
	dynamicHost!: DynamicComponentDirective;

	private route = inject(ActivatedRoute);
	private userStore = inject(UserStore);

	isLoading = computed(() => this.userStore.isLoading());

	private superAdminComponent: Type<any> | null = null;
	private defaultComponent: Type<any> | null = null;
	private viewInitialized = false;

	constructor() {
		// Get component mappings from route data
		this.route.data.subscribe((data) => {
			this.superAdminComponent = data['SuperAdminComponent'] ?? null;
			this.defaultComponent = data['DefaultComponent'] ?? null;
		});

		// Load component based on user role
		effect(() => {
			const user = this.userStore.user();
			const isLoading = this.userStore.isLoading();

			if (!isLoading && user && this.viewInitialized && this.dynamicHost) {
				this.loadComponent(user.role);
			}
		});
	}

	ngAfterViewInit(): void {
		this.viewInitialized = true;
		// Trigger component loading if user is already loaded
		const user = this.userStore.user();
		const isLoading = this.userStore.isLoading();
		if (!isLoading && user) {
			this.loadComponent(user.role);
		}
	}

	private loadComponent(role: userRoleEnum): void {
		let component: Type<any> | null = null;

		if (role === userRoleEnum.SUPER_ADMIN && this.superAdminComponent) {
			component = this.superAdminComponent;
		} else if (this.defaultComponent) {
			component = this.defaultComponent;
		}

		if (!component) {
			console.warn(`[DynamicComponentLoader] No component found for role: ${role}`);
			return;
		}

		this.renderComponent(component);
	}

	private renderComponent(component: Type<any>): void {
		if (!this.dynamicHost?.viewContainerRef) {
			console.warn('[DynamicComponentLoader] ViewContainerRef not available yet');
			return;
		}

		const viewContainerRef = this.dynamicHost.viewContainerRef;
		viewContainerRef.clear();
		viewContainerRef.createComponent(component);
	}
}
