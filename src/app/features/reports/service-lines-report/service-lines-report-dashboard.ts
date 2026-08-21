import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import type { ChartConfiguration } from 'chart.js';
import { ServiceLineReportRow } from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { ReportChart } from '../../../shared/components/report-chart/report-chart';

type StateFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS';

@Component({
  selector: 'app-service-lines-report-dashboard',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTableModule,
    DecimalPipe,
    DatePipe,
    ReportChart,
  ],
  templateUrl: './service-lines-report-dashboard.html',
  styleUrl: './service-lines-report-dashboard.scss',
})
export class ServiceLinesReportDashboard implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);

  readonly rows = signal<ServiceLineReportRow[]>([]);
  readonly loading = signal(false);

  readonly columns = ['started_date', 'order_number', 'order_state', 'service_name', 'quantity', 'customer_name', 'vehicle_label', 'mechanic_name'];

  readonly stateOptions: { value: StateFilter; label: string }[] = [
    { value: 'ALL', label: 'Ambas' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'IN_PROGRESS', label: 'Pendientes' },
  ];

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
    state: new FormControl<StateFilter>('ALL', { nonNullable: true }),
  });

  readonly totalOrders = computed(() => new Set(this.rows().map((r) => r.order_id)).size);

  readonly chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const ordersByState = new Map<string, Set<string>>();
    for (const row of this.rows()) {
      const set = ordersByState.get(row.order_state) ?? new Set<string>();
      set.add(row.order_id);
      ordersByState.set(row.order_state, set);
    }
    return {
      labels: ['Completadas', 'Pendientes'],
      datasets: [
        {
          data: [ordersByState.get('COMPLETED')?.size ?? 0, ordersByState.get('IN_PROGRESS')?.size ?? 0],
          backgroundColor: ['#2e7d32', '#1565c0'],
        },
      ],
    };
  });

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.getRawValue();
    const states = raw.state === 'ALL' ? (['COMPLETED', 'IN_PROGRESS'] as const) : ([raw.state] as const);

    this.loading.set(true);
    this.serviceOrderProvider
      .getServiceLinesReport({
        from: raw.from ? this.toIsoDate(raw.from) : undefined,
        to: raw.to ? this.toIsoDate(raw.to) : undefined,
        states: [...states],
      })
      .subscribe({
        next: (data) => {
          this.rows.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error al cargar el reporte', 'Cerrar', { duration: 4000 });
        },
      });
  }

  onClearFilters(): void {
    this.filterForm.reset({ from: null, to: null, state: 'ALL' });
    this.search();
  }

  stateLabel(state: string): string {
    return state === 'COMPLETED' ? 'Completada' : 'Pendiente';
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
