import { Component, inject, Type, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DynamicComponentDirective } from '../../directives/dynamic-component.directive';
import { PermissionsService } from '../../services/permission.service';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-dynamic-component-loader',
	standalone: true,
	imports: [DynamicComponentDirective],
	templateUrl: './dynamic-component-loader.component.html',
	styleUrl: './dynamic-component-loader.component.css',
})
export class DynamicComponentLoaderComponent implements AfterViewInit {
	@ViewChild(DynamicComponentDirective, { static: false })
	dynamicHost!: DynamicComponentDirective;

	private route = inject(ActivatedRoute);
	private permissionsService = inject(PermissionsService);

	private superAdminComponent: Type<any> | null = null;
	private defaultComponent: Type<any> | null = null;

	constructor() {
		this.route.data.subscribe((data) => {
			this.superAdminComponent = data['SuperAdminComponent'] ?? null;
			this.defaultComponent = data['DefaultComponent'] ?? null;
		});
	}

	ngAfterViewInit(): void {
		const role = this.permissionsService.userRole();
		this.loadComponent(role);
	}

	private loadComponent(role: userRoleEnum | null): void {
		let component: Type<any> | null = null;

		if (role === userRoleEnum.SUPER_ADMIN && this.superAdminComponent) {
			component = this.superAdminComponent;
		} else if (this.defaultComponent) {
			component = this.defaultComponent;
		}

		if (!component) {
			return;
		}

		this.renderComponent(component);
	}

	private renderComponent(component: Type<any>): void {
		if (!this.dynamicHost?.viewContainerRef) {
			return;
		}

		const viewContainerRef = this.dynamicHost.viewContainerRef;
		viewContainerRef.clear();
		viewContainerRef.createComponent(component);
	}
}
