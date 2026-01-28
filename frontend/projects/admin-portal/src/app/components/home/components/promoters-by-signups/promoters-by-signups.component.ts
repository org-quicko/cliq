import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf, NgForOf } from '@angular/common';
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';
import { ProgramStore } from '../../../../store/program.store';
import { PromoterSignupsStore } from '../dashboard/store/promoter-signups.store';

@Component({
    selector: 'app-promoters-by-signups',
    standalone: true,
    templateUrl: './promoters-by-signups.component.html',
    styleUrls: ['./promoters-by-signups.component.css'],
    imports: [
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatMenuModule,
        NgIf,
        NgForOf,
        NgxSkeletonLoaderModule,
        FormatCurrencyPipe,
    ],
    providers: [PromoterSignupsStore]
})
export class PromotersBySignupsComponent implements OnInit {
    readonly programStore = inject(ProgramStore);
    readonly promoterSignupsStore = inject(PromoterSignupsStore);
    private router = inject(Router);

    labelColumn = 'Promoters';
    valueColumn = 'Commission';

    readonly program = computed(() => this.programStore.program());
    readonly programId = computed(() => this.programStore.program()?.programId);

    readonly periodOptions = [
        { value: '7days', label: 'Last 7 days' },
        { value: '30days', label: 'Last 30 days' },
        { value: '3months', label: 'Last 3 months' },
        { value: '6months', label: 'Last 6 months' },
        { value: '1year', label: 'Last 1 year' },
        { value: 'all', label: 'All time' },
    ];

    selectedPeriod = signal<string>('30days');

    ngOnInit() {
        this.fetchData();
    }

    get chartData() {
        return this.promoterSignupsStore.popularityData() ?? [];
    }

    get maxValue() {
        return this.chartData.length > 0
            ? Math.max(...this.chartData.map(d => d.value))
            : 0;
    }

    get isLoading() {
        return this.promoterSignupsStore.isLoading();
    }

    get currency() {
        return this.program()?.currency || 'INR';
    }

    onNavigateToDashboard() {
        const id = this.programId();
        this.router.navigate([`/admin/${id}/home/dashboard`]);
    }

    onPeriodChange(period: string) {
        this.selectedPeriod.set(period);
        this.fetchData();
    }

    getPeriodLabel(value: string): string {
        return this.periodOptions.find(p => p.value === value)?.label || 'Last 30 days';
    }

    getBarWidth(value: number): number {
        return this.maxValue > 0 ? (value / this.maxValue) * 100 : 0;
    }

    private fetchData() {
        const programId = this.programId();
        if (!programId) return;

        this.promoterSignupsStore.fetchPromotersBySignups({
            programId,
            period: this.selectedPeriod(),
            take: 100, // Get all promoters for this page
        });
    }
}
