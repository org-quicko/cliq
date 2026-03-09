import { Component, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { FormatCurrencyPipe, MetricType } from '@org.quicko.cliq/ngx-core';

Chart.register(...registerables);

export interface DailyData {
    date: string;
    signups: number;
    purchases: number;
    revenue: number;
    commission: number;
    signupCommission?: number;
    purchaseCommission?: number;
}

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

    readonly MetricType = MetricType;

    hasData = false;
    selectedMetric = signal<MetricType>(MetricType.SIGNUPS);
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
                legend: {
                    display: false,
                    position: 'bottom' as const,
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 16,
                        color: onSurfaceVariant,
                        font: { size: 12 },
                    },
                },
                tooltip: {
                    backgroundColor: surfaceContainerLowest,
                    titleColor: onSurfaceVariant,
                    bodyColor: onSurfaceVariant,
                    footerColor: onSurfaceVariant,
                    borderColor: outlineVariant,
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: (items: TooltipItem<'bar'>[]) => this.getTooltipTitle(items[0].dataIndex),
                        label: (ctx: TooltipItem<'bar'>) => {
                            const metric = this.selectedMetric();
                            const value = ctx.parsed.y ?? 0;
                            if (metric === MetricType.COMMISSION) {
                                return ` ${ctx.dataset.label}  ${this.formatCurrency(value)}`;
                            }
                            return (metric === MetricType.REVENUE)
                                ? ` ${this.getMetricLabel(metric)}  ${this.formatCurrency(value)}`
                                : ` ${this.getMetricLabel(metric)}  ${value.toLocaleString()}`;
                        },
                        footer: (items: TooltipItem<'bar'>[]) => {
                            const metric = this.selectedMetric();
                            if (metric === MetricType.COMMISSION && items.length > 1) {
                                const total = items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
                                return `Total commission  ${this.formatCurrency(total)}`;
                            }
                            return '';
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

        const isCommission = metric === MetricType.COMMISSION;

        if (isCommission) {
            // Stacked bar chart for commission breakdown
            const purchaseCommissions = this.graphData.map(d => d.purchaseCommission ?? 0);
            const signupCommissions = this.graphData.map(d => d.signupCommission ?? 0);

            const maxValue = Math.max(
                ...this.processedData.map((_, i) => (purchaseCommissions[i] + signupCommissions[i])),
                0
            );
            const stepSize = this.calculateStepSize(maxValue);

            if (this.chartOptions?.scales?.y?.ticks) {
                this.chartOptions.scales.y.ticks.stepSize = stepSize;
            }

            this.chartOptions.scales.x.stacked = true;
            this.chartOptions.scales.y.stacked = true;
            this.chartOptions.plugins.legend.display = true;

            const secondary80 = getComputedStyle(document.documentElement).getPropertyValue('--sys-secondary-80').trim();
            const secondary90 = getComputedStyle(document.documentElement).getPropertyValue('--sys-secondary-90').trim();
            const primary70 = getComputedStyle(document.documentElement).getPropertyValue('--sys-primary-70').trim();
            const primary60 = getComputedStyle(document.documentElement).getPropertyValue('--sys-primary-60').trim();

            this.chartData = {
                labels: this.processedData.map(p => p.xLabel),
                datasets: [
                    {
                        label: 'Signup Commission',
                        data: signupCommissions,
                        backgroundColor: secondary90,
                        hoverBackgroundColor: secondary80,
                        borderColor: secondary90,
                        hoverBorderColor: secondary80,
                        borderWidth: 1,
                        borderRadius: 0,
                        stack: 'commission',
                    },
                    {
                        label: 'Purchase Commission',
                        data: purchaseCommissions,
                        backgroundColor: primary70,
                        hoverBackgroundColor: primary60,
                        borderColor: primary70,
                        hoverBorderColor: primary60,
                        borderWidth: 1,
                        borderRadius: { topLeft: 4, topRight: 4 },
                        stack: 'commission',
                    },
                ]
            };
        } else {
            // Single bar for other metrics
            this.chartOptions.scales.x.stacked = false;
            this.chartOptions.scales.y.stacked = false;
            this.chartOptions.plugins.legend.display = false;

            const maxValue = Math.max(...this.processedData.map(p => p.value), 0);
            const stepSize = this.calculateStepSize(maxValue);

            if (this.chartOptions?.scales?.y?.ticks) {
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
        }

        setTimeout(() => this.chart?.update());
    }

    private calculateStepSize(maxValue: number): number {
        if (maxValue === 0) return 1;

    
        const targetTicks = 5;
        const rawStep = maxValue / targetTicks;


        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));

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

 
        if (this.period === 'all' || this.dataType === 'yearly') {
            return d.getFullYear().toString();
        }


        if (this.period === '6months' || this.period === '1year' || this.dataType === 'monthly') {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

 
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
