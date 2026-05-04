import { inject, Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Supplier } from '../../models/supplier.model';
import { Contact } from '../../models/contact.model';
import { SPContact } from './sb-contact';

@Injectable({ providedIn: 'root' })
export class SPSupplier {
  private supabase: SupabaseClient;
  private contactService = inject(SPContact);
  private data$ = new BehaviorSubject<Supplier[]>([]);
  private listening = false;

  private readonly TABLE_NAME = 'suppliers';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<Supplier[]> {
    return from(this.supabase.from(this.TABLE_NAME).select('*')).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const suppliers: Supplier[] = data ?? [];
        if (!suppliers.length) return of([]);

        const ids = suppliers.map((s) => s.id);
        return from(
          this.supabase.from('contacts').select('*').in('reference_id', ids),
        ).pipe(
          map(({ data: contactsData }) => {
            const contacts: Contact[] = contactsData ?? [];
            return suppliers.map((s) => ({
              ...s,
              contacts: contacts.filter((ct) => ct.reference_id === s.id),
            }));
          }),
        );
      }),
    );
  }

  public add(item: Supplier): Observable<Supplier[]> {
    const { id, created_at, updated_at, contacts, ...payload } = item;
    return from(this.supabase.from(this.TABLE_NAME).insert([payload]).select()).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const created: Supplier = data?.[0];
        if (!contacts?.length) return of([created]);

        return this.contactService.upsertForReference(created.id, contacts).pipe(
          map((savedContacts) => [{ ...created, contacts: savedContacts }]),
        );
      }),
    );
  }

  public update(item: Supplier): Observable<Supplier[]> {
    const { created_at, updated_at, contacts, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE_NAME).update(payload).eq('id', item.id).select(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          console.error('Error en Supabase:', error.message);
          throw error;
        }
        const updated: Supplier = data?.[0];
        return this.contactService.upsertForReference(item.id, contacts ?? []).pipe(
          map((savedContacts) => [{ ...updated, contacts: savedContacts }]),
        );
      }),
    );
  }

  public delete(id: string): Observable<Supplier[]> {
    return this.contactService.deleteByReference(id).pipe(
      switchMap(() =>
        from(this.supabase.from(this.TABLE_NAME).delete().eq('id', id).select()).pipe(
          map(({ data, error }) => {
            if (error) {
              console.error('Error en Supabase:', error.message);
              throw error;
            }
            return data ?? [];
          }),
        ),
      ),
    );
  }

  public listen(): Observable<Supplier[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('suppliers-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }
}
