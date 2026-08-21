import { Component, computed, input } from '@angular/core';
import type { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { getChartPalette } from '../../utils/chart-colors';

@Component({
  selector: 'app-report-chart',
  imports: [BaseChartDirective],
  templateUrl: './report-chart.html',
  styleUrl: './report-chart.scss',
})
export class ReportChart {
  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartConfiguration['data']>();
  readonly options = input<ChartConfiguration['options']>();
  readonly height = input('18rem');

  readonly isEmpty = computed(() => {
    const datasets = this.data().datasets ?? [];
    return datasets.every((d) => !d.data?.length || (d.data as number[]).every((v) => !v));
  });

  readonly mergedOptions = computed<ChartConfiguration['options']>(() => {
    const palette = getChartPalette();
    const consumer = this.options() ?? {};
    const isRadial = this.type() === 'doughnut' || this.type() === 'pie';

    return {
      responsive: true,
      maintainAspectRatio: false,
      ...consumer,
      plugins: {
        legend: { labels: { color: palette.textColor } },
        ...consumer.plugins,
      },
      ...(isRadial
        ? {}
        : {
            scales: {
              x: { ticks: { color: palette.mutedColor }, grid: { color: palette.gridColor } },
              y: { ticks: { color: palette.mutedColor }, grid: { color: palette.gridColor } },
              ...consumer.scales,
            },
          }),
    };
  });
}
