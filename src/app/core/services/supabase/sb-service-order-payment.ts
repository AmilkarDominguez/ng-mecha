import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BankAccountHistory } from '../../models/bank-account-history.model';
import { BankTransactionType } from '../../models/bank-transaction-type.model';
import { SPBankAccountHistory } from './sb-bank-account-history';
import { SPBankTransactionType } from './sb-bank-transaction-type';

const PAYMENT_TYPE_NAME = 'Pago de orden de servicio';

export interface RegisterPaymentInput {
  serviceOrderId: string;
  bankAccountId: string;
  amount: number;
  concept: string | null;
  userId: string | null;
}

export interface EditPaymentInput {
  bankAccountId: string;
  amount: number;
  concept: string | null;
}

/**
 * Un pago toca 3 tablas (bank_account_histories, bank_accounts,
 * service_orders). Las mutaciones se delegan a RPCs de Postgres
 * (register/edit/delete_service_order_payment, ver migrate.sql v19) para
 * que corran en una sola transaccion — llamadas REST separadas desde el
 * cliente no son atomicas y pueden dejar el balance desincronizado si una
 * falla a mitad de camino.
 */
@Injectable({ providedIn: 'root' })
export class SPServiceOrderPayment {
  private supabase: SupabaseClient;
  private historyService = inject(SPBankAccountHistory);
  private transactionTypeService = inject(SPBankTransactionType);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public list(serviceOrderId: string): Observable<BankAccountHistory[]> {
    return this.getPaymentTransactionType().pipe(
      switchMap((type) => this.historyService.getByReference(serviceOrderId, type.id)),
    );
  }

  public register(input: RegisterPaymentInput): Observable<BankAccountHistory> {
    return this.getPaymentTransactionType().pipe(
      switchMap((type) =>
        from(
          this.supabase.rpc('register_service_order_payment', {
            p_service_order_id: input.serviceOrderId,
            p_bank_account_id: input.bankAccountId,
            p_transaction_type_id: type.id,
            p_amount: input.amount,
            p_concept: input.concept,
            p_user_id: input.userId,
          }),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return data as BankAccountHistory;
      }),
    );
  }

  public edit(history: BankAccountHistory, changes: EditPaymentInput): Observable<BankAccountHistory> {
    return from(
      this.supabase.rpc('edit_service_order_payment', {
        p_history_id: history.id,
        p_bank_account_id: changes.bankAccountId,
        p_amount: changes.amount,
        p_concept: changes.concept,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return data as BankAccountHistory;
      }),
    );
  }

  public remove(history: BankAccountHistory): Observable<void> {
    return from(this.supabase.rpc('delete_service_order_payment', { p_history_id: history.id })).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }

  private getPaymentTransactionType(): Observable<BankTransactionType> {
    return this.transactionTypeService.get().pipe(
      map((types) => {
        const type = types.find((t) => t.type === 'INCOME' && t.name === PAYMENT_TYPE_NAME);
        if (!type) {
          throw new Error(
            `No se encontró el tipo de transacción '${PAYMENT_TYPE_NAME}'. Verifique que exista en Tipos de Transacción.`,
          );
        }
        return type;
      }),
    );
  }
}
