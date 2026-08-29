import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ChartConfiguration } from 'chart.js';
import { MechanicWorkloadRow } from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { ReportChart } from '../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../shared/utils/chart-colors';

const TOP_N = 10;

@Component({
  selector: 'app-mechanic-workload-report-dashboard',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    DecimalPipe,
    ReportChart,
  ],
  templateUrl: './mechanic-workload-report-dashboard.html',
  styleUrl: './mechanic-workload-report-dashboard.scss',
})
export class MechanicWorkloadReportDashboard implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);

  readonly rows = signal<MechanicWorkloadRow[]>([]);
  readonly loading = signal(false);

  readonly columns = ['rank', 'mechanic_name', 'orders_count', 'services_count', 'income'];

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly totalOrders = computed(() => this.rows().reduce((acc, r) => acc + r.orders_count, 0));
  readonly totalServices = computed(() => this.rows().reduce((acc, r) => acc + r.services_count, 0));

  readonly chartTopCount = computed(() => Math.min(TOP_N, this.rows().length));

  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const palette = getChartPalette();
    const top = this.rows().slice(0, TOP_N);
    return {
      labels: top.map((r) => r.mechanic_name),
      datasets: [{ label: 'Órdenes Atendidas', data: top.map((r) => r.orders_count), backgroundColor: palette.primary }],
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
  };

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.value;
    this.loading.set(true);
    this.serviceOrderProvider
      .getMechanicWorkloadReport({
        from: raw.from ? this.toIsoDate(raw.from) : undefined,
        to: raw.to ? this.toIsoDate(raw.to) : undefined,
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
    this.filterForm.reset({ from: null, to: null });
    this.search();
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
