import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProgramsSummaryStore, ProgramSummaryMvDto } from './store/programs.store';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PaginationOptions, OrdinalDatePipe } from '@org.quicko.cliq/ngx-core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatSortModule, Sort } from '@angular/material/sort';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-super-admin-programs',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        ReactiveFormsModule,
        NgxSkeletonLoaderModule,
        OrdinalDatePipe,
        DecimalPipe
    ],
    providers: [ProgramsSummaryStore],
    templateUrl: './super-admin-programs.component.html',
    styleUrls: ['./super-admin-programs.component.css'],
})
export class SuperAdminProgramsComponent implements OnInit {
    columns = ['name', 'totalPromoters', 'totalReferrals', 'createdAt', 'navigate'];
    searchControl: FormControl;
    tempDatasource: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
    isFilterApplied = false;
    paginationOptions = signal<PaginationOptions>({
        pageIndex: 0,
        pageSize: 10,
    });

    sortOptions = signal<{ active: 'createdAt'; direction: 'asc' | 'desc' }>({
        active: 'createdAt',
        direction: 'desc',
    });

    datasource = new MatTableDataSource<ProgramSummaryMvDto>();

    programsStore = inject(ProgramsSummaryStore);

    programs = this.programsStore.programs;
    count = this.programsStore.count;
    isLoading = this.programsStore.isLoading;

    constructor(private router: Router) {
        this.searchControl = new FormControl('');

        effect(() => {
            const programs = this.programs() ?? [];
            const { pageIndex, pageSize } = this.paginationOptions();

            const start = pageIndex * pageSize;
            const end = start + pageSize;

            this.datasource.data = programs.slice(start, end);
        });
    }

    ngOnInit() {
        this.programsStore.resetLoadedPages();

        this.programsStore.fetchProgramsSummary({
            skip: 0,
            take: 10
        });

        this.searchControl.valueChanges
            .pipe(debounceTime(500), distinctUntilChanged())
            .subscribe((value: string) => {
                this.isFilterApplied = true;

                this.paginationOptions.set({
                    pageIndex: 0,
                    pageSize: 10,
                });

                this.programsStore.resetLoadedPages();

                this.programsStore.fetchProgramsSummary({
                    filter: {
                        name: value.trim(),
                    },
                });
            });
    }

    onRowClick(program: ProgramSummaryMvDto) {
        this.router.navigate([`/${program.programId}/home/dashboard`]);
    }

    onCreateProgram() {
        this.router.navigate(['/programs/create']);
    }

    onPageChange(event: PageEvent) {
        this.paginationOptions.set({
            pageIndex: event.pageIndex,
            pageSize: event.pageSize,
        });

        this.programsStore.fetchProgramsSummary({
            skip: event.pageIndex * event.pageSize,
            take: event.pageSize,
        });
    }

    onSortChange(event: Sort) {
        this.paginationOptions.set({
            pageIndex: 0,
            pageSize: 10
        });

        this.programsStore.resetLoadedPages();

        this.programsStore.resetPrograms();

        this.sortOptions.set({
            active: 'createdAt',
            direction: event.direction as 'asc' | 'desc'
        });

        this.programsStore.fetchProgramsSummary({
            isSortOperation: true
        });
    }
}
