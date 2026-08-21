import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import type { ChartConfiguration } from 'chart.js';
import { ServiceFrequencyRow } from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';
import { ReportChart } from '../../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../../shared/utils/chart-colors';

const TOP_N = 5;

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

@Component({
  selector: 'app-top-services-card',
  imports: [MatCardModule, MatIconModule, ReportChart],
  templateUrl: './top-services-card.html',
  styleUrl: './top-services-card.scss',
})
export class TopServicesCard {
  private serviceOrderProvider = inject(SPServiceOrder);

  private readonly monthStart = (() => {
    const now = new Date();
    return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  })();

  private readonly rows = toSignal(this.serviceOrderProvider.getServiceFrequencyReport({ from: this.monthStart }), {
    initialValue: [] as ServiceFrequencyRow[],
  });

  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const palette = getChartPalette();
    const top = this.rows().slice(0, TOP_N);
    return {
      labels: top.map((r) => r.service_name),
      datasets: [{ label: 'Veces Realizado', data: top.map((r) => r.quantity), backgroundColor: palette.tertiary }],
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
  };
}
