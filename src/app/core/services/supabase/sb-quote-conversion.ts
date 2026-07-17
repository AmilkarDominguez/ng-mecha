import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Cascadas multi-tabla del ciclo de vida de una cotizacion: aprobar
 * (reserva stock), rechazar/anular (libera reservas) y convertir a Orden de
 * Servicio (copia lineas + consume reservas + recalcula totales de la
 * orden). Todo vive en RPCs de Postgres, nunca en forkJoin desde Angular —
 * ver .claude/commands/quote-module.md.
 */
@Injectable({ providedIn: 'root' })
export class SPQuoteConversion {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public approve(quoteId: string): Observable<void> {
    return from(this.supabase.rpc('reserve_quote_batches', { p_quote_id: quoteId })).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }

  public reject(quoteId: string): Observable<void> {
    return this.release(quoteId, 'REJECTED');
  }

  public cancel(quoteId: string): Observable<void> {
    return this.release(quoteId, 'CANCELED');
  }

  public convertToOrder(quoteId: string, serviceOrderId: string): Observable<void> {
    return from(
      this.supabase.rpc('convert_quote_to_order', {
        p_quote_id: quoteId,
        p_service_order_id: serviceOrderId,
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }

  private release(quoteId: string, targetState: 'REJECTED' | 'CANCELED'): Observable<void> {
    return from(
      this.supabase.rpc('release_quote_reservations', {
        p_quote_id: quoteId,
        p_target_state: targetState,
      }),
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    );
  }
}
