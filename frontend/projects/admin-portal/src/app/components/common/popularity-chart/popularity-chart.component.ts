import { Component, Input, signal, computed, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgForOf, CurrencyPipe } from '@angular/common';
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

export interface PopularityDataItem {
    label: string;
    value: number;
    subValue?: number;
    revenue?: number;
}

@Component({
    selector: 'app-popularity-chart',
    standalone: true,
    imports: [MatCardModule, MatDividerModule, MatIconModule, NgIf, NgForOf, FormatCurrencyPipe, NgxSkeletonLoaderModule],
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
    @Input() isLoading: boolean = false;

    @Input() useSubValueAsAlternate: boolean = false;

    // Controlled by parent - when parent needs to maintain state across re-renders
    @Input() alternateActive: boolean = false;

    @Output() toggleChanged = new EventEmitter<boolean>();

    // Internal signal for uncontrolled mode (when alternateActive input is not used)
    private _showAlternate = signal(false);

    // Use input if provided, otherwise use internal state
    showAlternate(): boolean {
        return this.alternateActive || this._showAlternate();
    }

    toggleValueType() {
        console.log('[PopularityChart] toggleValueType called');
        const newValue = !this.showAlternate();
        this._showAlternate.set(newValue);
        console.log('[PopularityChart] Emitting toggleChanged:', newValue);
        this.toggleChanged.emit(newValue);
    }

    get displayedValueColumn(): string {
        return this.showAlternate() ? this.alternateValueColumn : this.valueColumn;
    }

    getDisplayValue(item: PopularityDataItem): number {
        if (this.showAlternate()) {
            return this.useSubValueAsAlternate ? (item.subValue ?? 0) : (item.revenue ?? 0);
        }
        return item.value;
    }

    // Check if we should format as currency
    shouldFormatAsCurrency(): boolean {
   
        return !(this.showAlternate() && this.useSubValueAsAlternate);
    }

    constructor(private router: Router) {}

    get maxValue(): number {
        if (this.data.length === 0) return 0;
        if (this.showAlternate()) {
            return this.useSubValueAsAlternate
                ? Math.max(...this.data.map(d => d.subValue ?? 0))
                : Math.max(...this.data.map(d => d.revenue ?? 0));
        }
        return Math.max(...this.data.map(d => d.value));
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
