import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import type { ChartConfiguration } from 'chart.js';
import { BankAccountHistory } from '../../../../core/models/bank-account-history.model';
import { SPBankAccountHistory } from '../../../../core/services/supabase/sb-bank-account-history';
import { ReportChart } from '../../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../../shared/utils/chart-colors';

const DAYS = 30;

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function sumByDate(rows: BankAccountHistory[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.created_at) continue;
    const date = toIsoDate(new Date(r.created_at));
    totals.set(date, (totals.get(date) ?? 0) + (r.amount ?? 0));
  }
  return totals;
}

@Component({
  selector: 'app-income-expense-trend-card',
  imports: [MatCardModule, MatIconModule, ReportChart],
  templateUrl: './income-expense-trend-card.html',
  styleUrl: './income-expense-trend-card.scss',
})
export class IncomeExpenseTrendCard {
  private historyService = inject(SPBankAccountHistory);

  private readonly range = (() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (DAYS - 1));
    return { from: toIsoDate(from), to: toIsoDate(to) };
  })();

  private readonly dates = (() => {
    const days: string[] = [];
    const cursor = new Date(this.range.from + 'T00:00:00');
    for (let i = 0; i < DAYS; i++) {
      days.push(toIsoDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  })();

  private readonly incomeRows = toSignal(this.historyService.getByTransactionKind('INCOME', this.range), {
    initialValue: [] as BankAccountHistory[],
  });
  private readonly expenseRows = toSignal(this.historyService.getByTransactionKind('EXPENSE', this.range), {
    initialValue: [] as BankAccountHistory[],
  });

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const palette = getChartPalette();
    const incomeByDate = sumByDate(this.incomeRows());
    const expenseByDate = sumByDate(this.expenseRows());
    return {
      labels: this.dates,
      datasets: [
        {
          label: 'Ingresos',
          data: this.dates.map((d) => incomeByDate.get(d) ?? 0),
          borderColor: palette.primary,
          backgroundColor: palette.primary,
          tension: 0.3,
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Egresos',
          data: this.dates.map((d) => expenseByDate.get(d) ?? 0),
          borderColor: palette.red,
          backgroundColor: palette.red,
          tension: 0.3,
          fill: false,
          pointRadius: 0,
        },
      ],
    };
  });

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: Bs. ${(ctx.parsed as { y: number }).y.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 8 } },
    },
  };
}
