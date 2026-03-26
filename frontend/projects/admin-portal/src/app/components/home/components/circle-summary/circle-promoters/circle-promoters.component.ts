import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CircleSummaryStore } from '../store/circle-summary.store';
import { CirclePromotersStore } from '../store/circle.promoters.store';
import { OrdinalDatePipe } from '@org.quicko.cliq/ngx-core';

@Component({
	selector: 'app-circle-promoters',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatInputModule,
		MatIconModule,
		MatPaginatorModule,
		NgxSkeletonLoaderModule,
		OrdinalDatePipe
	],
	providers: [CircleSummaryStore, CirclePromotersStore],
	templateUrl: './circle-promoters.component.html',
	styleUrl: './circle-promoters.component.css',
})
export class CirclePromotersComponent implements OnInit {
	readonly circleSummaryStore = inject(CircleSummaryStore);
	readonly circlePromotersStore = inject(CirclePromotersStore);
	private route = inject(ActivatedRoute);
	private router = inject(Router);

	programId!: string;
	circleId!: string;

	searchControl = new FormControl('');

	paginationOptions = signal({
		pageIndex: 0,
		pageSize: 10,
	});

	readonly isCircleLoading = this.circleSummaryStore.isLoading;
	readonly isPromotersLoading = this.circlePromotersStore.isLoading;
	readonly circleName = this.circleSummaryStore.circleName;
	readonly promoters = this.circlePromotersStore.promoters;
	readonly promotersTotal = this.circlePromotersStore.total;

	ngOnInit(): void {
		this.route.parent?.params.subscribe((params: Params) => {
			this.circleId = params['circle_id'];
		});

		this.route.parent?.parent?.parent?.params.subscribe((params: Params) => {
			this.programId = params['program_id'];
			this.circleSummaryStore.fetchCircle({ programId: this.programId, circleId: this.circleId });
			this.loadPromoters();
		});

		this.searchControl.valueChanges
			.pipe(debounceTime(400), distinctUntilChanged())
			.subscribe(() => {
				this.paginationOptions.set({ pageIndex: 0, pageSize: this.paginationOptions().pageSize });
				this.loadPromoters();
			});
	}

	loadPromoters() {
		this.circlePromotersStore.fetchCirclePromoters({
			programId: this.programId,
			circleId: this.circleId,
			search: this.searchControl.value?.trim() || undefined,
			skip: this.paginationOptions().pageIndex * this.paginationOptions().pageSize,
			take: this.paginationOptions().pageSize,
		});
	}

	onPageChange(event: PageEvent) {
		this.paginationOptions.set({
			pageIndex: event.pageIndex,
			pageSize: event.pageSize,
		});
		this.loadPromoters();
	}

	goBack() {
		this.router.navigate(['..'], { relativeTo: this.route });
	}

	goToCircles() {
		this.router.navigate(['../../'], { relativeTo: this.route });
	}
}
