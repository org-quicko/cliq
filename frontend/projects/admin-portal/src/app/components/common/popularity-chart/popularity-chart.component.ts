import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgIf, NgForOf, CurrencyPipe } from '@angular/common';
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';

export interface PopularityDataItem {
    label: string;
    value: number;
    subValue?: number;
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
    @Input() data: PopularityDataItem[] = [];
    @Input() navigationText: string = 'View all';
    @Input() navigationLink: string = '';
    @Input() showSubValue: boolean = false;
    @Input() currency: string = 'INR';

    constructor(private router: Router) {}

    get maxValue(): number {
        return this.data.length > 0
            ? Math.max(...this.data.map(d => d.value))
            : 0;
    }

    onNavigate() {
        if (this.navigationLink) {
            this.router.navigate([this.navigationLink], { relativeTo: null });
        }
    }

    getBarWidth(value: number): number {
        return this.maxValue > 0 ? (value / this.maxValue) * 100 : 0;
    }
}
