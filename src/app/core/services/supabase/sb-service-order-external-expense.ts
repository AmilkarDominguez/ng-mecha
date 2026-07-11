import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BankAccountHistory } from '../../models/bank-account-history.model';

export interface ApplyExternalServiceExpenseInput {
  lineId: string;
  bankAccountId: string;
  cost: number | null;
  quantity: number | null;
  concept: string;
  userId: string | null;
}

/**
 * Efecto financiero de los trabajos adicionales / servicios externos de una
 * orden (bank_account_histories + bank_accounts). A diferencia de
 * sb-batch-purchase.ts (que reconcilia in-place porque un lote es una
 * entidad estable), las lineas de orden se sincronizan con delete-all +
 * re-insert (ver service-order-form.ts), asi que aqui no se reconcilia por
 * linea: se revierte TODO lo de la orden antes de recrear las lineas, y se
 * vuelve a aplicar TODO despues. Ver
 * .claude/commands/service-order-external-expense.md.
 */
@Injectable({ providedIn: 'root' })
export class SPServiceOrderExternalExpense {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public apply(input: ApplyExternalServiceExpenseInput): Observable<BankAccountHistory> {
    return from(
      this.supabase.rpc('apply_external_service_expense', {
        p_line_id: input.lineId,
        p_bank_account_id: input.bankAccountId,
        p_cost: input.cost,
        p_quantity: input.quantity,
        p_concept: input.concept,
        p_user_id: input.userId,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return data as BankAccountHistory;
      }),
    );
  }

  public reverseForOrder(serviceOrderId: string): Observable<void> {
    return from(
      this.supabase.rpc('reverse_external_service_expenses_for_order', {
        p_service_order_id: serviceOrderId,
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }
}
