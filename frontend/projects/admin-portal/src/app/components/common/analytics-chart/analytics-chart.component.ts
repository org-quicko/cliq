import { Component, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';

Chart.register(...registerables);


export interface DailyData {
    date: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
}

type MetricType = 'signups' | 'purchases' | 'revenue' | 'commission';

@Component({
    selector: 'app-analytics-chart',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, FormatCurrencyPipe],
    templateUrl: './analytics-chart.component.html',
    styles: [`:host { display: block; }`]
})
export class AnalyticsChartComponent implements OnInit, OnChanges, OnDestroy {
    @Input() graphData: DailyData[] = [];
    @Input() period: string = '30days';
    @Input() currency: string = 'INR';
    @Input() dataType: string = 'daily';
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    constructor(private cdr: ChangeDetectorRef) { }

    hasData = false;
    selectedMetric = signal<MetricType>('signups');
    currentChartType: 'bar' | 'line' = 'bar';

    totalSignups = 0;
    totalPurchases = 0;
    totalRevenue = 0;
    totalCommission = 0;

    chartData: any = { labels: [], datasets: [] };
    chartOptions: any;

    private initChartOptions(): void {
        const onSurfaceVariant = getComputedStyle(document.documentElement).getPropertyValue('--sys-on-surface-variant').trim();
        const outlineVariant = getComputedStyle(document.documentElement).getPropertyValue('--sys-outline-variant').trim();
        const surfaceContainerLowest = getComputedStyle(document.documentElement).getPropertyValue('--sys-surface-container-lowest').trim();

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                mode: 'index',
                intersect: false
            },

            elements: {
                line: {
                    capBezierPoints: true
                }
            },

            scales: {
                x: {
                    ticks: { color: onSurfaceVariant, font: { size: 11 }, autoSkip: false, maxRotation: 0 },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    ticks: {
                        color: onSurfaceVariant,
                        font: { size: 11 },
                        stepSize: 1,
                        callback: function (value: number | string) {
                            return Number.isInteger(value) ? value : null;
                        }
                    },
                    grid: { color: outlineVariant, lineWidth: 1 },
                },
            },

            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: surfaceContainerLowest,
                    titleColor: onSurfaceVariant,
                    bodyColor: onSurfaceVariant,
                    borderColor: outlineVariant,
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: (items: TooltipItem<'bar'>[]) => this.getTooltipTitle(items[0].dataIndex),
                        label: (ctx: TooltipItem<'bar'>) => {
                            const metric = this.selectedMetric();
                            const value = ctx.parsed.y ?? 0;
                            return (metric === 'revenue' || metric === 'commission')
                                ? ` ${this.getMetricLabel(metric)}  ${this.formatCurrency(value)}`
                                : ` ${this.getMetricLabel(metric)}  ${value.toLocaleString()}`;
                        }
                    }
                }
            }
        };
    }

    private processedData: { date: Date; value: number; xLabel: string }[] = [];

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['graphData'] || changes['period'] || changes['dataType']) this.updateChart();
    }

    ngOnDestroy(): void { }

    selectMetric(metric: MetricType): void {
        this.selectedMetric.set(metric);
        this.updateChartData();
        this.cdr.markForCheck();
    }

    private updateChart(): void {
        if (!this.chartOptions) {
            this.initChartOptions();
        }
        
        if (!this.graphData?.length) {
            this.hasData = false;
            this.clearChartData();
            this.calculateTotals();
            return;
        }
        this.hasData = true;
        this.calculateTotals();
        this.updateChartData();
    }


    private updateChartData(): void {
        const metric = this.selectedMetric();
        this.currentChartType = 'bar';

        this.processedData = this.graphData.map(d => {
            const date = new Date(d.date);
            const value = d[metric] ?? 0;
            return { date, value, xLabel: '' };
        });

        this.assignXLabels();

        // Calculate max value and determine appropriate step size
        const maxValue = Math.max(...this.processedData.map(p => p.value), 0);
        const stepSize = this.calculateStepSize(maxValue);

        // Update y-axis stepSize dynamically
        if (this.chartOptions.scales.y.ticks) {
            this.chartOptions.scales.y.ticks.stepSize = stepSize;
        }

        const secondary90 = getComputedStyle(document.documentElement).getPropertyValue('--sys-secondary-90').trim();
        const secondary80 = getComputedStyle(document.documentElement).getPropertyValue('--sys-secondary-80').trim();
        
        this.chartData = {
            labels: this.processedData.map(p => p.xLabel),
            datasets: [{
                label: this.getMetricLabel(metric),
                data: this.processedData.map(p => p.value),
                borderColor: secondary90,
                borderWidth: 1,
                backgroundColor: secondary90,
                hoverBackgroundColor: secondary80,
                hoverBorderColor: secondary80,
                borderRadius: 4,
            }]
        };

        setTimeout(() => this.chart?.update());
    }

    private calculateStepSize(maxValue: number): number {
        if (maxValue === 0) return 1;

        // Target roughly 5-6 ticks on the y-axis
        const targetTicks = 5;
        const rawStep = maxValue / targetTicks;

        // Find the magnitude (power of 10)
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));

        // Normalize to 1, 2, or 5 times the magnitude
        const normalized = rawStep / magnitude;
        let niceStep;

        if (normalized <= 1) {
            niceStep = 1;
        } else if (normalized <= 2) {
            niceStep = 2;
        } else if (normalized <= 5) {
            niceStep = 5;
        } else {
            niceStep = 10;
        }

        return Math.max(1, niceStep * magnitude);
    }

    private assignXLabels(): void {
        const period = this.period;
        const data = this.processedData;

        if (period === '7days') {

            data.forEach(p => p.xLabel = p.date.toLocaleDateString('en-US', { weekday: 'short' }));
        } else if (period === '30days') {
            const interval = Math.max(1, Math.floor(data.length / 10));
            data.forEach((p, i) => {
                if (i % interval === 0 || i === data.length - 1) {
                    p.xLabel = p.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                } else {
                    p.xLabel = '';
                }
            });
        } else if (period === '3months') {
            data.forEach(p => {
                p.xLabel = p.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            });
        } else if (period === '6months' || period === '1year') {

            data.forEach(p => {
                p.xLabel = p.date.toLocaleDateString('en-US', { month: 'short' });
            });
        } else if (period === 'all') {
            data.forEach(p => {
                p.xLabel = p.date.getFullYear().toString();
            });
        } else if (period === 'custom') {
            if (this.dataType === 'yearly') {

                data.forEach(p => {
                    p.xLabel = p.date.getFullYear().toString();
                });
            } else if (this.dataType === 'monthly') {

                data.forEach(p => {
                    p.xLabel = p.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                });
            } else if (this.dataType === 'weekly') {
                data.forEach(p => {
                    p.xLabel = p.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                });
            } else if (this.dataType === 'daily-7') {
                data.forEach(p => p.xLabel = p.date.toLocaleDateString('en-US', { weekday: 'short' }));
            } else if (this.dataType === 'daily-30') {
                const interval = Math.max(1, Math.floor(data.length / 10));
                data.forEach((p, i) => {
                    if (i % interval === 0 || i === data.length - 1) {
                        p.xLabel = p.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    } else {
                        p.xLabel = '';
                    }
                });
            } else {
                // Fallback: daily data - show date with month at intervals
                const interval = Math.max(1, Math.floor(data.length / 10));
                data.forEach((p, i) => {
                    if (i % interval === 0 || i === data.length - 1) {
                        p.xLabel = p.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    } else {
                        p.xLabel = '';
                    }
                });
            }
        } else {
            // Default: show month names
            let lastMonth = '';
            data.forEach(p => {
                const month = p.date.toLocaleDateString('en-US', { month: 'short' });
                p.xLabel = month !== lastMonth ? (lastMonth = month) : '';
            });
        }
    }

    private getMetricLabel(metric: MetricType): string {
        return metric.charAt(0).toUpperCase() + metric.slice(1);
    }

    private getTooltipTitle(index: number): string {
        const d = this.processedData[index]?.date;
        if (!d) return '';

        // For yearly data: show only year
        if (this.period === 'all' || this.dataType === 'yearly') {
            return d.getFullYear().toString();
        }

        // For monthly data: show month and year (no day)
        if (this.period === '6months' || this.period === '1year' || this.dataType === 'monthly') {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        // For all other cases: show full date
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    private formatCurrency(value: number): string {
        return this.currency === 'INR'
            ? '₹' + value.toLocaleString('en-IN')
            : new Intl.NumberFormat('en-US', { style: 'currency', currency: this.currency }).format(value);
    }

    private clearChartData(): void {
        this.chartData = { labels: [], datasets: [] };
        this.processedData = [];
    }

    private calculateTotals(): void {
        this.totalSignups = this.graphData.reduce((s, p) => s + (p.signups || 0), 0);
        this.totalPurchases = this.graphData.reduce((s, p) => s + (p.purchases || 0), 0);
        this.totalRevenue = this.graphData.reduce((s, p) => s + (p.revenue || 0), 0);
        this.totalCommission = this.graphData.reduce((s, p) => s + (p.commission || 0), 0);
    }
}
