import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BankAccountHistory } from '../../models/bank-account-history.model';
import { BankTransactionType } from '../../models/bank-transaction-type.model';
import { SPBankTransactionType } from './sb-bank-transaction-type';

// Tipos EXPENSE reservados a otros flujos automaticos — no se ofrecen en el
// selector de este modulo (compra de lote, pago de servicio externo ya
// tienen su propio proceso con su propia RPC).
const RESERVED_EXPENSE_TYPE_NAMES = ['Compra lote de productos', 'Pago servicio externo'];

export interface RegisterExpenseInput {
  bankAccountId: string;
  transactionTypeId: string;
  amount: number;
  concept: string | null;
  userId: string | null;
}

export interface EditExpenseInput {
  bankAccountId: string;
  transactionTypeId: string;
  amount: number;
  concept: string | null;
}

/**
 * Egresos manuales (ej. retiros) — no ligados a ninguna orden de servicio,
 * lote u otro flujo (transaction_reference siempre NULL). Las mutaciones
 * se delegan a RPCs de Postgres (register/edit/delete_bank_expense, ver
 * migrate.sql v25) por el mismo motivo que los ingresos manuales: un
 * movimiento toca bank_account_histories + bank_accounts en una sola
 * transaccion, y no debe calcularse en el cliente.
 */
@Injectable({ providedIn: 'root' })
export class SPBankExpense {
  private supabase: SupabaseClient;
  private transactionTypeService = inject(SPBankTransactionType);
  private data$ = new BehaviorSubject<BankAccountHistory[]>([]);
  private listening = false;

  private readonly TABLE_NAME = 'bank_account_histories';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public list(): Observable<BankAccountHistory[]> {
    return from(
      this.supabase
        .from(this.TABLE_NAME)
        .select('*, bank_account:bank_accounts(id,name,number), transaction_type:bank_transaction_types!inner(id,name,type)')
        .is('transaction_reference', null)
        .eq('transaction_type.type', 'EXPENSE')
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public listen(): Observable<BankAccountHistory[]> {
    this.list().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('bank-expense-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.list().subscribe((items) => this.data$.next(items));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }

  public expenseTransactionTypes(): Observable<BankTransactionType[]> {
    return this.transactionTypeService.get().pipe(
      map((types) =>
        types.filter(
          (t) => t.type === 'EXPENSE' && t.state === 'ACTIVE' && !RESERVED_EXPENSE_TYPE_NAMES.includes(t.name ?? ''),
        ),
      ),
    );
  }

  public register(input: RegisterExpenseInput): Observable<BankAccountHistory> {
    return from(
      this.supabase.rpc('register_bank_expense', {
        p_bank_account_id: input.bankAccountId,
        p_transaction_type_id: input.transactionTypeId,
        p_amount: input.amount,
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

  public edit(historyId: string, changes: EditExpenseInput): Observable<BankAccountHistory> {
    return from(
      this.supabase.rpc('edit_bank_expense', {
        p_history_id: historyId,
        p_bank_account_id: changes.bankAccountId,
        p_transaction_type_id: changes.transactionTypeId,
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

  public remove(historyId: string): Observable<void> {
    return from(this.supabase.rpc('delete_bank_expense', { p_history_id: historyId })).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }
}
