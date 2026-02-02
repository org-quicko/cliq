import { Component, Input, signal, computed, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgForOf, CurrencyPipe } from '@angular/common';
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';

export interface PopularityDataItem {
    label: string;
    value: number;
    subValue?: number;
    revenue?: number;
}

@Component({
    selector: 'app-popularity-chart',
    standalone: true,
    imports: [MatCardModule, MatIconModule, NgIf, NgForOf, FormatCurrencyPipe],
    templateUrl: './popularity-chart.component.html',
    styleUrls: ['./popularity-chart.component.css'],
})
export class PopularityChartComponent {
    @Input() title: string = '';
    @Input() labelColumn: string = 'Label';
    @Input() valueColumn: string = 'Value';
    @Input() alternateValueColumn: string = 'Revenue';
    @Input() data: PopularityDataItem[] = [];
    @Input() navigationText: string = 'View all';
    @Input() navigationLink: string = '';
    @Input() showSubValue: boolean = false;
    @Input() currency: string = 'INR';
    @Input() showToggle: boolean = false;

    // Toggle state: false = Commission (value), true = Revenue
    showRevenue = signal(false);

    toggleValueType() {
        this.showRevenue.update(v => !v);
    }

    get displayedValueColumn(): string {
        return this.showRevenue() ? this.alternateValueColumn : this.valueColumn;
    }

    getDisplayValue(item: PopularityDataItem): number {
        return this.showRevenue() ? (item.revenue ?? 0) : item.value;
    }

    constructor(private router: Router) {}

    get maxValue(): number {
        if (this.data.length === 0) return 0;
        return this.showRevenue()
            ? Math.max(...this.data.map(d => d.revenue ?? 0))
            : Math.max(...this.data.map(d => d.value));
    }

    onNavigate() {
        if (this.navigationLink) {
            this.router.navigate([this.navigationLink], { relativeTo: null });
        }
    }

    getBarWidth(item: PopularityDataItem): number {
        const value = this.getDisplayValue(item);
        return this.maxValue > 0 ? (value / this.maxValue) * 100 : 0;
    }
}
