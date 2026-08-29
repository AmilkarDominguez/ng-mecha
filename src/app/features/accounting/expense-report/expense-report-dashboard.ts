import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ChartConfiguration } from 'chart.js';
import { BankAccountHistory } from '../../../core/models/bank-account-history.model';
import { SPBankAccount } from '../../../core/services/supabase/sb-bank-account';
import { SPBankAccountHistory } from '../../../core/services/supabase/sb-bank-account-history';
import { ReportChart } from '../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../shared/utils/chart-colors';

@Component({
  selector: 'app-expense-report-dashboard',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    DecimalPipe,
    DatePipe,
    ReportChart,
  ],
  templateUrl: './expense-report-dashboard.html',
  styleUrl: './expense-report-dashboard.scss',
})
export class ExpenseReportDashboard implements OnInit {
  private bankAccountService = inject(SPBankAccount);
  private historyService = inject(SPBankAccountHistory);
  private snackBar = inject(MatSnackBar);

  private readonly bankAccounts = toSignal(this.bankAccountService.listen(), { initialValue: [] });
  readonly activeBankAccounts = computed(() => this.bankAccounts().filter((a) => a.state === 'ACTIVE'));

  readonly rows = signal<BankAccountHistory[]>([]);
  readonly loading = signal(false);

  readonly columns = ['created_at', 'bank_account', 'transaction_type', 'concept', 'amount'];

  readonly filterForm = new FormGroup({
    bank_account_ids: new FormControl<string[]>([]),
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly totalExpense = computed(() => this.rows().reduce((acc, r) => acc + (r.amount ?? 0), 0));

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const palette = getChartPalette();
    const totalsByDate = new Map<string, number>();
    for (const r of this.rows()) {
      if (!r.created_at) continue;
      const date = new Date(r.created_at).toISOString().split('T')[0];
      totalsByDate.set(date, (totalsByDate.get(date) ?? 0) + (r.amount ?? 0));
    }
    const dates = Array.from(totalsByDate.keys()).sort();
    return {
      labels: dates,
      datasets: [
        {
          label: 'Egreso diario (Bs.)',
          data: dates.map((d) => totalsByDate.get(d)!),
          borderColor: palette.red,
          backgroundColor: palette.red,
          tension: 0.3,
          fill: false,
        },
      ],
    };
  });

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Bs. ${(ctx.parsed as { y: number }).y.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
  };

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.value;
    this.loading.set(true);
    this.historyService
      .getByTransactionKind('EXPENSE', {
        bankAccountIds: raw.bank_account_ids?.length ? raw.bank_account_ids : undefined,
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
    this.filterForm.reset({ bank_account_ids: [], from: null, to: null });
    this.search();
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
