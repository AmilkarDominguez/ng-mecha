import { Injectable } from '@angular/core';
import { from, Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import {
  ServiceOrderProcessCheckLine,
  ServiceOrderChecklistSection,
  ProcessCheckSourceType,
} from '../../models/service-order-process-check.model';

@Injectable({ providedIn: 'root' })
export class SPServiceOrderProcessCheck {
  private supabase: SupabaseClient;
  private readonly TABLE_NAME = 'service_order_process_checks';
  private readonly SELECT_WITH_JOINS =
    '*, process:processes(description, position), checked_by_user:users(id,name,lastname)';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Sincroniza el checklist de una orden (RPC sync_service_order_process_checks):
   * agrega filas faltantes para los servicios/servicios externos ACTUALES
   * de la orden y elimina las de servicios que ya no estan en la orden.
   * Debe llamarse antes de getSections() para que la vista refleje el
   * estado real de las lineas de la orden.
   */
  sync(serviceOrderId: string): Observable<void> {
    return from(this.supabase.rpc('sync_service_order_process_checks', { p_service_order_id: serviceOrderId })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  toggle(id: string, checked: boolean, userId: string | null): Observable<ServiceOrderProcessCheckLine> {
    return from(
      this.supabase
        .from(this.TABLE_NAME)
        .update({
          checked,
          checked_at: checked ? new Date().toISOString() : null,
          checked_by: checked ? userId : null,
        })
        .eq('id', id)
        .select(this.SELECT_WITH_JOINS)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as ServiceOrderProcessCheckLine;
      }),
    );
  }

  /**
   * Trae el checklist de una orden ya agrupado en secciones (una por
   * servicio/servicio externo), con los procesos ordenados por
   * processes.position. source_id es un id de catalogo (services.id /
   * external_services.id) sin FK real (referencia polimorfica, igual
   * patron que processes.reference_id), asi que el nombre de cada
   * seccion se resuelve con 2 queries adicionales en vez de un join.
   */
  getSections(serviceOrderId: string): Observable<ServiceOrderChecklistSection[]> {
    return from(
      this.supabase.from(this.TABLE_NAME).select(this.SELECT_WITH_JOINS).eq('service_order_id', serviceOrderId),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as unknown as ServiceOrderProcessCheckLine[];
      }),
      switchMap((checks) => this.withSourceNames(checks)),
    );
  }

  private withSourceNames(checks: ServiceOrderProcessCheckLine[]): Observable<ServiceOrderChecklistSection[]> {
    const serviceIds = this.distinctSourceIds(checks, 'SERVICE');
    const externalIds = this.distinctSourceIds(checks, 'EXTERNAL_SERVICE');

    return forkJoin({
      services: serviceIds.length ? this.fetchNames('services', serviceIds) : of([]),
      externals: externalIds.length ? this.fetchNames('external_services', externalIds) : of([]),
    }).pipe(map(({ services, externals }) => this.buildSections(checks, services, externals)));
  }

  private distinctSourceIds(checks: ServiceOrderProcessCheckLine[], type: ProcessCheckSourceType): string[] {
    return Array.from(new Set(checks.filter((c) => c.source_type === type).map((c) => c.source_id)));
  }

  private fetchNames(table: string, ids: string[]): Observable<{ id: string; name: string | null }[]> {
    return from(this.supabase.from(table).select('id,name').in('id', ids)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  private buildSections(
    checks: ServiceOrderProcessCheckLine[],
    services: { id: string; name: string | null }[],
    externals: { id: string; name: string | null }[],
  ): ServiceOrderChecklistSection[] {
    const nameByKey = new Map<string, string>();
    for (const s of services) nameByKey.set(`SERVICE:${s.id}`, s.name ?? 'Servicio');
    for (const e of externals) nameByKey.set(`EXTERNAL_SERVICE:${e.id}`, e.name ?? 'Servicio externo');

    const sectionByKey = new Map<string, ServiceOrderChecklistSection>();
    for (const check of checks) {
      const key = `${check.source_type}:${check.source_id}`;
      let section = sectionByKey.get(key);
      if (!section) {
        section = {
          sourceType: check.source_type,
          sourceId: check.source_id,
          sourceName: nameByKey.get(key) ?? 'Sin nombre',
          items: [],
        };
        sectionByKey.set(key, section);
      }
      section.items.push(check);
    }

    const sections = Array.from(sectionByKey.values());
    for (const section of sections) {
      section.items.sort((a, b) => (a.process?.position ?? 0) - (b.process?.position ?? 0));
    }
    return sections.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
  }
}
