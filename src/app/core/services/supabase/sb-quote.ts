import { Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Quote,
  QuoteBatch,
  QuoteService,
  QuoteExternalService,
  QuoteWithLines,
} from '../../models/quote.model';

/**
 * CRUD de Cotizaciones, mismo patron que SPServiceOrder. La reserva de
 * stock, aprobacion/rechazo y conversion a Orden de Servicio NO viven aqui
 * (son cascadas multi-tabla → ver SPQuoteConversion). Ver
 * .claude/commands/quote-module.md.
 */
@Injectable({ providedIn: 'root' })
export class SPQuote {
  private supabase: SupabaseClient;
  private data$ = new BehaviorSubject<Quote[]>([]);
  private listening = false;

  private readonly TABLE = 'quotes';
  private readonly TABLE_SERVICES = 'quote_services';
  private readonly TABLE_BATCHES = 'quote_batches';
  private readonly TABLE_EXTERNAL = 'quote_external_services';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<Quote[]> {
    return this.expireOverdue().pipe(
      switchMap(() =>
        from(
          this.supabase
            .from(this.TABLE)
            .select('*, customer:customers(id,name,lastname), vehicle:vehicles(id,license_plate,brand,model)')
            .order('created_at', { ascending: false }),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public getById(id: string): Observable<Quote> {
    return from(
      this.supabase
        .from(this.TABLE)
        .select('*, customer:customers(id,name,lastname), vehicle:vehicles(id,license_plate,brand,model)')
        .eq('id', id)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public add(item: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle'>): Observable<Quote> {
    return from(this.supabase.from(this.TABLE).insert([item]).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public update(item: Quote): Observable<Quote> {
    const { id, created_at, updated_at, customer, vehicle, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE).update(payload).eq('id', id).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public delete(id: string): Observable<void> {
    return from(this.supabase.from(this.TABLE).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  public listen(): Observable<Quote[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('quotes-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }

  public getWithLines(id: string): Observable<QuoteWithLines> {
    return forkJoin({
      quote: from(
        this.supabase
          .from(this.TABLE)
          .select('*, customer:customers(id,name,lastname,ci,phone), vehicle:vehicles(id,license_plate,brand,model,year), user:users(id,name,lastname)')
          .eq('id', id)
          .single(),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data; })),
      services: from(
        this.supabase
          .from(this.TABLE_SERVICES)
          .select('*, service:services(name,code)')
          .eq('quote_id', id),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; })),
      batches: from(
        this.supabase
          .from(this.TABLE_BATCHES)
          .select('*, batch:batches(description, product:products(name), industry:industries(name))')
          .eq('quote_id', id),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; })),
      externals: from(
        this.supabase
          .from(this.TABLE_EXTERNAL)
          .select('*, external_service:external_services(name,company_name)')
          .eq('quote_id', id),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; })),
    }).pipe(
      map(({ quote, services, batches, externals }) => ({
        ...quote,
        lines_services: services,
        lines_batches: batches,
        lines_externals: externals,
      })),
    );
  }

  // Quote Services
  public bulkAddServices(items: Omit<QuoteService, 'id' | 'created_at' | 'updated_at'>[]): Observable<QuoteService[]> {
    return from(this.supabase.from(this.TABLE_SERVICES).insert(items).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  // Quote Batches
  public bulkAddBatches(items: Omit<QuoteBatch, 'id' | 'created_at' | 'updated_at'>[]): Observable<QuoteBatch[]> {
    return from(this.supabase.from(this.TABLE_BATCHES).insert(items).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  // Quote External Services
  public bulkAddExternalServices(items: Omit<QuoteExternalService, 'id' | 'created_at' | 'updated_at'>[]): Observable<QuoteExternalService[]> {
    return from(this.supabase.from(this.TABLE_EXTERNAL).insert(items).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public deleteLinesByQuoteId(quoteId: string): Observable<void> {
    return forkJoin([
      from(this.supabase.from(this.TABLE_SERVICES).delete().eq('quote_id', quoteId))
        .pipe(map(({ error }) => { if (error) throw error; })),
      from(this.supabase.from(this.TABLE_BATCHES).delete().eq('quote_id', quoteId))
        .pipe(map(({ error }) => { if (error) throw error; })),
      from(this.supabase.from(this.TABLE_EXTERNAL).delete().eq('quote_id', quoteId))
        .pipe(map(({ error }) => { if (error) throw error; })),
    ]).pipe(map(() => void 0));
  }

  /** Best-effort: nunca bloquea el listado si la RPC falla (ver quote-module.md #4.4). */
  private expireOverdue(): Observable<unknown> {
    return from(this.supabase.rpc('expire_overdue_quote_reservations')).pipe(catchError(() => of(null)));
  }
}
