import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import type { ChartConfiguration } from 'chart.js';
import { ServiceFrequencyRow } from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { ReportChart } from '../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../shared/utils/chart-colors';

const TOP_N = 10;

@Component({
  selector: 'app-service-frequency-report-dashboard',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    DecimalPipe,
    ReportChart,
  ],
  templateUrl: './service-frequency-report-dashboard.html',
  styleUrl: './service-frequency-report-dashboard.scss',
})
export class ServiceFrequencyReportDashboard implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);

  readonly rows = signal<ServiceFrequencyRow[]>([]);
  readonly loading = signal(false);

  readonly columns = ['rank', 'service_name', 'quantity', 'income'];

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly totalQuantity = computed(() => this.rows().reduce((acc, r) => acc + r.quantity, 0));
  readonly totalIncome = computed(() => this.rows().reduce((acc, r) => acc + r.income, 0));

  readonly chartTopCount = computed(() => Math.min(TOP_N, this.rows().length));

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

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.value;
    this.loading.set(true);
    this.serviceOrderProvider
      .getServiceFrequencyReport({
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
