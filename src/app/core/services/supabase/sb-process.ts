import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { Process } from '../../models/process.model';

@Injectable({ providedIn: 'root' })
export class SPProcess {
  private supabase: SupabaseClient;
  private readonly TABLE_NAME = 'processes';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  getByReference(referenceId: string): Observable<Process[]> {
    return from(
      this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('reference_id', referenceId)
        .order('position', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  /**
   * Replaces all processes for a given referenceId: deletes existing ones,
   * then inserts the new set in array order (array index -> position).
   * Mismo patron delete-all + reinsert que SPContact.upsertForReference.
   */
  upsertForReference(referenceId: string, processes: Process[]): Observable<Process[]> {
    return from(
      this.supabase.from(this.TABLE_NAME).delete().eq('reference_id', referenceId),
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        if (!processes.length) return of([]);

        const payload = processes.map(({ id, created_at, updated_at, ...rest }, index) => ({
          ...rest,
          reference_id: referenceId,
          position: index,
        }));

        return from(
          this.supabase.from(this.TABLE_NAME).insert(payload).select().order('position', { ascending: true }),
        ).pipe(
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
