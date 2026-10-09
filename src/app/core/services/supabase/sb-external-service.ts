import { inject, Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ExternalService } from '../../models/external-service.model';
import { Process } from '../../models/process.model';
import { SPProcess } from './sb-process';

@Injectable({ providedIn: 'root' })
export class SPExternalService {
  private supabase: SupabaseClient;
  private processService = inject(SPProcess);
  private data$ = new BehaviorSubject<ExternalService[]>([]);
  private listening = false;

  private readonly TABLE_NAME = 'external_services';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<ExternalService[]> {
    return from(this.supabase.from(this.TABLE_NAME).select('*')).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const items: ExternalService[] = data ?? [];
        if (!items.length) return of([]);

        const ids = items.map((s) => s.id);
        return from(
          this.supabase
            .from('processes')
            .select('*')
            .in('reference_id', ids)
            .order('position', { ascending: true }),
        ).pipe(
          map(({ data: processesData }) => {
            const processes: Process[] = processesData ?? [];
            return items.map((s) => ({
              ...s,
              processes: processes.filter((p) => p.reference_id === s.id),
            }));
          }),
        );
      }),
    );
  }

  public add(item: ExternalService): Observable<ExternalService[]> {
    const { id, created_at, updated_at, processes, ...payload } = item;
    return from(this.supabase.from(this.TABLE_NAME).insert([payload]).select()).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const created: ExternalService = data?.[0];
        if (!processes?.length) return of([created]);

        return this.processService.upsertForReference(created.id, processes).pipe(
          map((savedProcesses) => [{ ...created, processes: savedProcesses }]),
        );
      }),
    );
  }

  public update(item: ExternalService): Observable<ExternalService[]> {
    const { created_at, updated_at, processes, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE_NAME).update(payload).eq('id', item.id).select(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          console.error('Error en Supabase:', error.message);
          throw error;
        }
        const updated: ExternalService = data?.[0];
        return this.processService.upsertForReference(item.id, processes ?? []).pipe(
          map((savedProcesses) => [{ ...updated, processes: savedProcesses }]),
        );
      }),
    );
  }

  public delete(id: string): Observable<ExternalService[]> {
    return this.processService.deleteByReference(id).pipe(
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

  public listen(): Observable<ExternalService[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('external-services-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }
}
