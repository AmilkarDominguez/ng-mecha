import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import type { ChartConfiguration } from 'chart.js';
import { ServiceOrder } from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';
import { ReportChart } from '../../../../shared/components/report-chart/report-chart';

// Mismos colores que .state-chip en service-order-dashboard.scss /
// service-lines-report-dashboard.scss — el estado de orden se
// representa igual en todo el sistema.
const STATE_COLORS: Record<ServiceOrder['state'], string> = {
  IN_PROGRESS: '#1565c0',
  COMPLETED: '#2e7d32',
  CANCELED: '#c62828',
};

@Component({
  selector: 'app-order-status-card',
  imports: [MatCardModule, MatIconModule, ReportChart],
  templateUrl: './order-status-card.html',
  styleUrl: './order-status-card.scss',
})
export class OrderStatusCard {
  private serviceOrderProvider = inject(SPServiceOrder);

  private readonly orders = toSignal(this.serviceOrderProvider.listen(), { initialValue: [] as ServiceOrder[] });

  readonly total = computed(() => this.orders().length);

  readonly chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const counts: Record<ServiceOrder['state'], number> = { IN_PROGRESS: 0, COMPLETED: 0, CANCELED: 0 };
    for (const o of this.orders()) counts[o.state]++;
    return {
      labels: ['En Curso', 'Completadas', 'Canceladas'],
      datasets: [
        {
          data: [counts.IN_PROGRESS, counts.COMPLETED, counts.CANCELED],
          backgroundColor: [STATE_COLORS.IN_PROGRESS, STATE_COLORS.COMPLETED, STATE_COLORS.CANCELED],
        },
      ],
    };
  });
}
