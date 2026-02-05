import { Component, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { FormatCurrencyPipe } from '@org.quicko.cliq/ngx-core';

Chart.register(...registerables);

const verticalLinePlugin = {
  id: 'verticalLinePlugin',
  afterDraw: (chart: any) => {
   
    const isLineChart = chart.config.type === 'line';
    if (!isLineChart) return;

    if (!chart.tooltip?._active?.length) return;

    const ctx = chart.ctx;
    const activePoint = chart.tooltip._active[0];
    const x = activePoint.element.x;
    const topY = chart.scales.y.top;
    const bottomY = chart.scales.y.bottom;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E6E8F0'; // match design
    ctx.stroke();
    ctx.restore();
  }
};



Chart.register(verticalLinePlugin);


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

    constructor(private cdr: ChangeDetectorRef) {}

    hasData = false;
    selectedMetric = signal<MetricType>('signups');
    currentChartType: 'bar' | 'line' = 'bar';

    totalSignups = 0;
    totalPurchases = 0;
    totalRevenue = 0;
    totalCommission = 0;

    chartData: any = { labels: [], datasets: [] };

    chartOptions: any = {
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
                ticks: { color: '#45464F', font: { size: 11 }, autoSkip: false, maxRotation: 0 },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                ticks: { color: '#767680', font: { size: 11 }, count: 6 },
                grid: { color: '#C1C6D5', lineWidth: 1 },
            },
        },
        
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.95)',
                titleColor: '#333',
                bodyColor: '#666',
                borderColor: '#ddd',
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

    private processedData: { date: Date; value: number; xLabel: string }[] = [];

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['graphData'] || changes['period'] || changes['dataType']) this.updateChart();
    }

    ngOnDestroy(): void {}

    selectMetric(metric: MetricType): void {
        this.selectedMetric.set(metric);
        this.updateChartData();
        this.cdr.markForCheck();
    }

    private updateChart(): void {
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

// private getRevenueGradient(): CanvasGradient | string {
//     const chartInstance = this.chart?.chart;

//     if (!chartInstance) return '#BDC5ED';

//     const ctx = chartInstance.ctx;

//     // chartArea is undefined on first render
//     const chartArea = chartInstance.chartArea;
//     if (!chartArea) return '#BDC5ED';

//     const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
//     gradient.addColorStop(0, '#BDC5ED');   // near the line
//     gradient.addColorStop(1, '#FFFFFF');   // fade to bottom

//     return gradient;
// }

    private updateChartData(): void {
        const metric = this.selectedMetric();
        const isLineChart = metric === 'revenue';
        this.currentChartType = isLineChart ? 'line' : 'bar';

        this.processedData = this.graphData.map(d => {
            const date = new Date(d.date);
            const value = d[metric] ?? 0;
            return { date, value, xLabel: '' };
        });

        this.assignXLabels();

      this.chartData = {
  labels: this.processedData.map(p => p.xLabel),
  datasets: [{
    label: this.getMetricLabel(metric),
    data: this.processedData.map(p => p.value),

    borderColor: isLineChart ? '#BDC5ED' : '#DCE1FF',
    borderWidth: isLineChart ? 2 : 1,
    tension: 0.03,
    fill: isLineChart,

backgroundColor: isLineChart
  ? (context: any) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return 'rgba(189,197,237,0.25)';

      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

      // Stronger near the line
      gradient.addColorStop(0, 'rgba(189,197,237,0.35)');

      // Mid fade
      gradient.addColorStop(0.5, 'rgba(220,225,255,0.18)');

      // Almost invisible at bottom
      gradient.addColorStop(1, 'rgba(250,248,255,0.05)');

      return gradient;
    }
  : '#DCE1FF',


    hoverBackgroundColor: isLineChart ? undefined : '#BDC5ED',
    hoverBorderColor: '#BDC5ED',

    pointRadius: 0,        
    pointHoverRadius:4,     
    pointBackgroundColor: '#BDC5ED',
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,

    borderRadius: isLineChart ? 0 : 4,
  }]
};


        // Delay ensures gradient renders after layout
        setTimeout(() => this.chart?.update());
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
