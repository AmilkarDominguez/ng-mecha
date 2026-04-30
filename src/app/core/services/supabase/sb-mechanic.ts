import { inject, Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Mechanic } from '../../models/mechanic.model';
import { Contact } from '../../models/contact.model';
import { SPContact } from './sb-contact';

@Injectable({ providedIn: 'root' })
export class SPMechanic {
  private supabase: SupabaseClient;
  private contactService = inject(SPContact);
  private data$ = new BehaviorSubject<Mechanic[]>([]);
  private listening = false;

  private readonly TABLE_NAME = 'mechanics';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<Mechanic[]> {
    return from(this.supabase.from(this.TABLE_NAME).select('*')).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const mechanics: Mechanic[] = data ?? [];
        if (!mechanics.length) return of([]);

        const ids = mechanics.map((m) => m.id);
        return from(
          this.supabase.from('contacts').select('*').in('reference_id', ids),
        ).pipe(
          map(({ data: contactsData }) => {
            const contacts: Contact[] = contactsData ?? [];
            return mechanics.map((m) => ({
              ...m,
              contacts: contacts.filter((ct) => ct.reference_id === m.id),
            }));
          }),
        );
      }),
    );
  }

  public add(item: Mechanic): Observable<Mechanic[]> {
    const { id, created_at, updated_at, contacts, ...payload } = item;
    return from(this.supabase.from(this.TABLE_NAME).insert([payload]).select()).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const created: Mechanic = data?.[0];
        if (!contacts?.length) return of([created]);

        return this.contactService.upsertForReference(created.id, contacts).pipe(
          map((savedContacts) => [{ ...created, contacts: savedContacts }]),
        );
      }),
    );
  }

  public update(item: Mechanic): Observable<Mechanic[]> {
    const { created_at, updated_at, contacts, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE_NAME).update(payload).eq('id', item.id).select(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          console.error('Error en Supabase:', error.message);
          throw error;
        }
        const updated: Mechanic = data?.[0];
        return this.contactService.upsertForReference(item.id, contacts ?? []).pipe(
          map((savedContacts) => [{ ...updated, contacts: savedContacts }]),
        );
      }),
    );
  }

  public delete(id: string): Observable<Mechanic[]> {
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

  public listen(): Observable<Mechanic[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('mechanics-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }
}
