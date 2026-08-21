import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
import { Vehicle } from '../../../core/models/vehicle.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { ReportChart } from '../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../shared/utils/chart-colors';

const TOP_N = 10;

type VehicleDimension = 'brand' | 'model' | 'year';
type VehicleFrequencyRow = Pick<Vehicle, 'brand' | 'model' | 'year'>;

interface FrequencyRow {
  label: string;
  count: number;
  percentage: number;
}

const DIMENSION_LABELS: Record<VehicleDimension, string> = {
  brand: 'Marca',
  model: 'Modelo',
  year: 'Año',
};

function normalizeKey(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function toTitleCase(key: string): string {
  return key
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

@Component({
  selector: 'app-vehicle-frequency-report-dashboard',
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
    ReportChart,
  ],
  templateUrl: './vehicle-frequency-report-dashboard.html',
  styleUrl: './vehicle-frequency-report-dashboard.scss',
})
export class VehicleFrequencyReportDashboard implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);

  readonly rawRows = signal<VehicleFrequencyRow[]>([]);
  readonly loading = signal(false);
  readonly groupBy = signal<VehicleDimension>('brand');

  readonly columns = ['rank', 'label', 'count', 'percentage'];
  readonly dimensionLabel = computed(() => DIMENSION_LABELS[this.groupBy()]);

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly rows = computed<FrequencyRow[]>(() => {
    const dimension = this.groupBy();
    const raw = this.rawRows();
    const total = raw.length;
    if (total === 0) return [];

    const counts = new Map<string, number>();
    for (const v of raw) {
      const key = normalizeKey(v[dimension]);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([key, count]): FrequencyRow => ({
        label: toTitleCase(key),
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly totalOrders = computed(() => this.rawRows().length);

  readonly chartTopCount = computed(() => Math.min(TOP_N, this.rows().length));

  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const palette = getChartPalette();
    const top = this.rows().slice(0, TOP_N);
    return {
      labels: top.map((r) => r.label),
      datasets: [{ label: 'Órdenes', data: top.map((r) => r.count), backgroundColor: palette.tertiary }],
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
  };

  ngOnInit(): void {
    this.search();
  }

  setGroupBy(dimension: VehicleDimension): void {
    this.groupBy.set(dimension);
  }

  search(): void {
    const raw = this.filterForm.value;
    this.loading.set(true);
    this.serviceOrderProvider
      .getVehicleFrequency({
        from: raw.from ? this.toIsoDate(raw.from) : undefined,
        to: raw.to ? this.toIsoDate(raw.to) : undefined,
      })
      .subscribe({
        next: (data) => {
          this.rawRows.set(data);
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
