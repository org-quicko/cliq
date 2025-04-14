import { inject, Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { PromoterStore } from '../store/promoter.store';
import { SnackbarService } from '@org.quicko/ngx-core';

@Injectable({ providedIn: 'root' })
export class TncResolver implements Resolve<boolean> {
	constructor(
		private router: Router,
		private snackBarService: SnackbarService,
	) { }

	promoterStore = inject(PromoterStore);

	resolve(route: ActivatedRouteSnapshot): boolean {
		const promoter = this.promoterStore.promoter();

		if (promoter?.acceptedTermsAndConditions) {
			return true;
		}

		const programId = route.paramMap.get('program_id');
		this.router.navigate([`/${programId}/tnc`]);

		this.snackBarService.openSnackBar('Please accept the terms and conditions of the program first.', 'OK');

		// We don't return anything since we redirected the user away
		return false;
	}
}
