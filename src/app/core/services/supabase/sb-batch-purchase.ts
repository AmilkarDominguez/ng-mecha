import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BankAccountHistory } from '../../models/bank-account-history.model';

export interface ApplyBatchPurchaseInput {
  batchId: string;
  bankAccountId: string;
  cost: number | null;
  stock: number | null;
  code: string | null;
  userId: string | null;
}

export interface ReconcileBatchPurchaseInput {
  batchId: string;
  bankAccountId: string | null;
  cost: number | null;
  stock: number | null;
  code: string | null;
  userId: string | null;
}

/**
 * Efecto financiero de la compra de un lote (bank_account_histories +
 * bank_accounts). El CRUD de `batches` en sí sigue siendo REST plano vía
 * SPBatch — este servicio solo delega en las RPCs de Postgres
 * (apply/reconcile/reverse_batch_purchase, ver migrate.sql v20), que
 * corren en una sola transaccion. No usar forkJoin aquí — ver
 * sb-service-order-payment.ts y [[bank-account-history-payments]].
 */
@Injectable({ providedIn: 'root' })
export class SPBatchPurchase {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public apply(input: ApplyBatchPurchaseInput): Observable<BankAccountHistory> {
    return from(
      this.supabase.rpc('apply_batch_purchase', {
        p_batch_id: input.batchId,
        p_bank_account_id: input.bankAccountId,
        p_cost: input.cost,
        p_stock: input.stock,
        p_code: input.code,
        p_user_id: input.userId,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return data as BankAccountHistory;
      }),
    );
  }

  public reconcile(input: ReconcileBatchPurchaseInput): Observable<void> {
    return from(
      this.supabase.rpc('reconcile_batch_purchase', {
        p_batch_id: input.batchId,
        p_bank_account_id: input.bankAccountId,
        p_cost: input.cost,
        p_stock: input.stock,
        p_code: input.code,
        p_user_id: input.userId,
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }

  public reverse(batchId: string): Observable<void> {
    return from(this.supabase.rpc('reverse_batch_purchase', { p_batch_id: batchId })).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }
}
