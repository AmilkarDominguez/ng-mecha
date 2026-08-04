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
import { IncomeCompositionTotals } from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';

interface CompositionRow {
  category: 'LABOR' | 'PARTS' | 'EXTERNAL';
  label: string;
  income: number;
  percentage: number;
}

const EMPTY_TOTALS: IncomeCompositionTotals = { labor: 0, parts: 0, external: 0 };

@Component({
  selector: 'app-income-composition-report-dashboard',
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
  ],
  templateUrl: './income-composition-report-dashboard.html',
  styleUrl: './income-composition-report-dashboard.scss',
})
export class IncomeCompositionReportDashboard implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);

  readonly totals = signal<IncomeCompositionTotals>(EMPTY_TOTALS);
  readonly loading = signal(false);

  readonly columns = ['category', 'income', 'percentage'];

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly totalIncome = computed(() => {
    const t = this.totals();
    return t.labor + t.parts + t.external;
  });

  readonly rows = computed<CompositionRow[]>(() => {
    const t = this.totals();
    const total = this.totalIncome();
    const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);

    return [
      { category: 'LABOR' as const, label: 'Mano de Obra', income: t.labor, percentage: pct(t.labor) },
      { category: 'PARTS' as const, label: 'Repuestos', income: t.parts, percentage: pct(t.parts) },
      { category: 'EXTERNAL' as const, label: 'Servicios Externos', income: t.external, percentage: pct(t.external) },
    ].sort((a, b) => b.income - a.income);
  });

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.value;
    this.loading.set(true);
    this.serviceOrderProvider
      .getIncomeComposition({
        from: raw.from ? this.toIsoDate(raw.from) : undefined,
        to: raw.to ? this.toIsoDate(raw.to) : undefined,
      })
      .subscribe({
        next: (data) => {
          this.totals.set(data);
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
