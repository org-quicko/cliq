import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';

import { ReferralStore } from './store/referrals.store';
import { ReferralDto, referralSortByEnum } from '@org.quicko.cliq/ngx-core';

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './referrals.component.html',
})
export class ReferralsComponent implements OnInit {

  columns = [
    'contactInfo',
    'promoterName',
    'status',
    'totalCommission',
    'totalRevenue',
    'updatedAt'
  ];

  searchControl = new FormControl('');

  referralDatasource = new MatTableDataSource<ReferralDto>();

  paginationOptions = signal({
    pageIndex: 0,
    pageSize: 10,
  });

  referralStore = inject(ReferralStore);
  private route = inject(ActivatedRoute);

  referrals = this.referralStore.referrals;
  count = this.referralStore.count;
  isLoading = this.referralStore.isLoading;
  isSorting = this.referralStore.isSorting;
  error = this.referralStore.error;

  programId!: string;

  currentSort: { active: string; direction: 'asc' | 'desc' } = { active: 'updatedAt', direction: 'desc' };

  constructor() {
    effect(() => {
      const referrals = this.referrals();
      this.referralDatasource.data = referrals ?? [];
    });
  }

  ngOnInit(): void {

    this.route.parent?.parent?.params.subscribe((params: Params) => {
      this.programId = params['program_id'];

      this.paginationOptions.set({
        pageIndex: 0,
        pageSize: 10
      });

      this.fetchReferrals();
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {

        this.paginationOptions.set({
          pageIndex: 0,
          pageSize: 10
        });

        this.referralStore.fetchReferrals({
          programId: this.programId,
          skip: 0,
          take: 10,
          search: value?.trim(),
          isSearchOperation: true,
        });
      });
  }

fetchReferrals() {
  const sortFieldMap: Record<string, referralSortByEnum> = {
    updatedAt: referralSortByEnum.UPDATED_AT,
  };

  this.referralStore.fetchReferrals({
    programId: this.programId,
    skip: this.paginationOptions().pageIndex * this.paginationOptions().pageSize,
    take: this.paginationOptions().pageSize,
    sortOptions: {
      sortBy: sortFieldMap[this.currentSort.active],
      sortOrder: this.currentSort.direction === 'asc' ? 'ASC' : 'DESC',
    },
  });
}

  onPageChange(event: PageEvent) {
    this.paginationOptions.set({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize
    });

    this.fetchReferrals();
  }

  onSortChange(event: Sort) {
  if (event.active !== 'updatedAt') return;

  if (this.currentSort.active === event.active) {
    this.currentSort.direction =
      this.currentSort.direction === 'desc' ? 'asc' : 'desc';
  } else {
    this.currentSort = { active: event.active, direction: 'desc' };
  }

  this.paginationOptions.set({
    pageIndex: 0,
    pageSize: 10
  });

  this.fetchReferrals();   
}
}