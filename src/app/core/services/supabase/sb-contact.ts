import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { Contact } from '../../models/contact.model';

@Injectable({ providedIn: 'root' })
export class SPContact {
  private supabase: SupabaseClient;
  private readonly TABLE_NAME = 'contacts';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getByReference(referenceId: string): Observable<Contact[]> {
    return from(
      this.supabase.from(this.TABLE_NAME).select('*').eq('reference_id', referenceId),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  /**
   * Replaces all contacts for a given referenceId:
   * deletes existing ones, then inserts the new set.
   * If contacts is empty, only the deletion is performed.
   */
  upsertForReference(referenceId: string, contacts: Contact[]): Observable<Contact[]> {
    return from(
      this.supabase.from(this.TABLE_NAME).delete().eq('reference_id', referenceId),
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        if (!contacts.length) return of([]);

        const payload = contacts.map(({ id, created_at, updated_at, ...rest }) => ({
          ...rest,
          reference_id: referenceId,
        }));

        return from(this.supabase.from(this.TABLE_NAME).insert(payload).select()).pipe(
          map(({ data, error: insertError }) => {
            if (insertError) throw insertError;
            return data ?? [];
          }),
        );
      }),
    );
  }

  deleteByReference(referenceId: string): Observable<void> {
    return from(
      this.supabase.from(this.TABLE_NAME).delete().eq('reference_id', referenceId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
