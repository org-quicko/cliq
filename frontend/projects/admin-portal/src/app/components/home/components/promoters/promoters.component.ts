import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PromotersStore } from './store/promoters.store';
import { sortOrderEnum } from '@org.quicko.cliq/ngx-core';

@Component({
  selector: 'app-promoters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './promoters.component.html',
  providers: [PromotersStore],
})
export class PromotersComponent implements OnInit {

  searchControl = new FormControl('');

  paginationOptions = signal({
    pageIndex: 0,
    pageSize: 5,
  });

  order = signal(sortOrderEnum.ASCENDING);

  readonly SortOrder = sortOrderEnum;

  promotersStore = inject(PromotersStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  promoters = this.promotersStore.promoters;
  totalPromoters = this.promotersStore.totalPromoters;
  activePromoters = this.promotersStore.activePromoters;
  archivedPromoters = this.promotersStore.archivedPromoters;
  total = this.promotersStore.total;
  isLoading = this.promotersStore.isLoading;
  error = this.promotersStore.error;

  programId!: string;

  ngOnInit(): void {
    this.route.parent?.parent?.params.subscribe((params: Params) => {
      this.programId = params['program_id'];

      this.paginationOptions.set({ pageIndex: 0, pageSize: 5 });
      this.fetchPromoters();
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.paginationOptions.set({ pageIndex: 0, pageSize: 5 });
        this.promotersStore.fetchPromoters({
          programId: this.programId,
          search: value?.trim() || undefined,
          skip: 0,
          take: 5,
        });
      });
  }

  toggleSort() {
    this.order.set(this.order() === sortOrderEnum.ASCENDING ? sortOrderEnum.DESCENDING : sortOrderEnum.ASCENDING);
    this.fetchPromoters();
  }

  fetchPromoters() {
    this.promotersStore.fetchPromoters({
      programId: this.programId,
      search: this.searchControl.value?.trim() || undefined,
      skip: this.paginationOptions().pageIndex * this.paginationOptions().pageSize,
      take: this.paginationOptions().pageSize,
      order: this.order(),
    });
  }

  onPageChange(event: PageEvent) {
    this.paginationOptions.set({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
    });
    this.fetchPromoters();
  }

  viewPromoterSummary(promoterId: string) {
    this.router.navigate([promoterId], { relativeTo: this.route });
  }
}

