import { Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BankAccount } from '../../models/bank-account.model';

@Injectable({ providedIn: 'root' })
export class SPBankAccount {
  private supabase: SupabaseClient;
  private data$ = new BehaviorSubject<BankAccount[]>([]);
  private listening = false;

  private readonly TABLE_NAME: string = 'bank_accounts';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<BankAccount[]> {
    return from(this.supabase.from(this.TABLE_NAME).select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public add(item: BankAccount): Observable<BankAccount[]> {
    const { id, created_at, updated_at, ...payload } = item;
    return from(this.supabase.from(this.TABLE_NAME).insert([payload]).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public update(item: BankAccount): Observable<BankAccount[]> {
    const { created_at, updated_at, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE_NAME).update(payload).eq('id', item.id).select(),
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

  public delete(id: string): Observable<BankAccount[]> {
    return from(
      this.supabase.from(this.TABLE_NAME).delete().eq('id', id).select(),
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

  public listen(): Observable<BankAccount[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('bank_accounts-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }
}
