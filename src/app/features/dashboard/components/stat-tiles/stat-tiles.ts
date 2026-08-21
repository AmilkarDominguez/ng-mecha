import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BankAccountHistory } from '../../../../core/models/bank-account-history.model';
import { ServiceOrder } from '../../../../core/models/service-order.model';
import { SPBankAccountHistory } from '../../../../core/services/supabase/sb-bank-account-history';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

@Component({
  selector: 'app-stat-tiles',
  imports: [DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './stat-tiles.html',
  styleUrl: './stat-tiles.scss',
})
export class StatTiles {
  private serviceOrderProvider = inject(SPServiceOrder);
  private historyService = inject(SPBankAccountHistory);

  private readonly monthRange = (() => {
    const now = new Date();
    return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toIsoDate(now) };
  })();

  private readonly orders = toSignal(this.serviceOrderProvider.listen(), { initialValue: [] as ServiceOrder[] });
  private readonly monthIncome = toSignal(this.historyService.getByTransactionKind('INCOME', this.monthRange), {
    initialValue: [] as BankAccountHistory[],
  });
  private readonly monthExpense = toSignal(this.historyService.getByTransactionKind('EXPENSE', this.monthRange), {
    initialValue: [] as BankAccountHistory[],
  });

  readonly inProgressCount = computed(() => this.orders().filter((o) => o.state === 'IN_PROGRESS').length);
  readonly totalIncome = computed(() => this.monthIncome().reduce((acc, r) => acc + (r.amount ?? 0), 0));
  readonly totalExpense = computed(() => this.monthExpense().reduce((acc, r) => acc + (r.amount ?? 0), 0));
  readonly netUtility = computed(() => this.totalIncome() - this.totalExpense());
}
