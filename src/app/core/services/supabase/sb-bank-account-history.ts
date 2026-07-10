import { Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BankAccountHistory } from '../../models/bank-account-history.model';

@Injectable({ providedIn: 'root' })
export class SPBankAccountHistory {
  private supabase: SupabaseClient;
  private data$ = new BehaviorSubject<BankAccountHistory[]>([]);
  private listening = false;

  private readonly TABLE_NAME: string = 'bank_account_histories';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<BankAccountHistory[]> {
    return from(this.supabase.from(this.TABLE_NAME).select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public getByReference(
    transactionReference: string,
    transactionTypeId: string,
  ): Observable<BankAccountHistory[]> {
    return from(
      this.supabase
        .from(this.TABLE_NAME)
        .select('*, bank_account:bank_accounts(id,name,number)')
        .eq('transaction_reference', transactionReference)
        .eq('transaction_type_id', transactionTypeId)
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public add(item: Omit<BankAccountHistory, 'id' | 'created_at' | 'updated_at'>): Observable<BankAccountHistory> {
    return from(this.supabase.from(this.TABLE_NAME).insert([item]).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public update(item: BankAccountHistory): Observable<BankAccountHistory> {
    const { id, created_at, updated_at, bank_account, transaction_type, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE_NAME).update(payload).eq('id', id).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error en Supabase:', error.message);
          throw error;
        }
        return data;
      }),
    );
  }

  public delete(id: string): Observable<void> {
    return from(this.supabase.from(this.TABLE_NAME).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  public listen(): Observable<BankAccountHistory[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('bank_account_histories-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }
}
