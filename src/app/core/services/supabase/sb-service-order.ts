import { Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ServiceOrder,
  ServiceOrderBatch,
  ServiceOrderService,
  ServiceOrderExternalService,
  ServiceOrderWithLines,
  ServiceOrderUtilityRow,
  ProductSalesReportRow,
} from '../../models/service-order.model';

export interface UtilityReportFilters {
  from?: string;
  to?: string;
}

export interface ProductSalesReportFilters {
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class SPServiceOrder {
  private supabase: SupabaseClient;
  private data$ = new BehaviorSubject<ServiceOrder[]>([]);
  private listening = false;

  private readonly TABLE = 'service_orders';
  private readonly TABLE_SERVICES = 'service_order_services';
  private readonly TABLE_BATCHES = 'service_order_batches';
  private readonly TABLE_EXTERNAL = 'service_order_external_services';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public get(): Observable<ServiceOrder[]> {
    return from(
      this.supabase
        .from(this.TABLE)
        .select('*, customer:customers(id,name,lastname), vehicle:vehicles(id,license_plate,brand,model)')
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public getById(id: string): Observable<ServiceOrder> {
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

  public add(item: Omit<ServiceOrder, 'id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle'>): Observable<ServiceOrder> {
    return from(this.supabase.from(this.TABLE).insert([item]).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public update(item: ServiceOrder): Observable<ServiceOrder> {
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

  public listen(): Observable<ServiceOrder[]> {
    this.get().subscribe((items) => this.data$.next(items));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('service-orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE }, () => {
          this.get().subscribe((data) => this.data$.next(data));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }

  public getWithLines(id: string): Observable<ServiceOrderWithLines> {
    return forkJoin({
      order: from(
        this.supabase
          .from(this.TABLE)
          .select('*, customer:customers(id,name,lastname,ci,phone), vehicle:vehicles(id,license_plate,brand,model,year), mechanic:mechanics(id,name,lastname), user:users(id,name,lastname)')
          .eq('id', id)
          .single(),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data; })),
      services: from(
        this.supabase
          .from(this.TABLE_SERVICES)
          .select('*, service:services(name,code), quote:quotes(number)')
          .eq('service_order_id', id),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; })),
      batches: from(
        this.supabase
          .from(this.TABLE_BATCHES)
          .select('*, batch:batches(description, product:products(name), industry:industries(name)), quote:quotes(number)')
          .eq('service_order_id', id),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; })),
      externals: from(
        this.supabase
          .from(this.TABLE_EXTERNAL)
          .select('*, external_service:external_services(name,company_name), quote:quotes(number)')
          .eq('service_order_id', id),
      ).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; })),
    }).pipe(
      map(({ order, services, batches, externals }) => ({
        ...order,
        order_services: services,
        order_batches: batches,
        order_externals: externals,
      })),
    );
  }

  /**
   * Reporte de Utilidades (reports.md A.1): una fila por orden en el rango
   * de fechas (started_date), con ingreso (total, sin IVA), costo (suma de
   * repuestos + servicios externos; mano de obra no tiene costo) y
   * utilidad. Una sola query con embeds one-to-many de PostgREST — no
   * requiere RPC ni forkJoin, el agregado se calcula en el cliente sobre
   * las lineas ya embebidas.
   */
  public getUtilityReport(filters: UtilityReportFilters): Observable<ServiceOrderUtilityRow[]> {
    let query = this.supabase
      .from(this.TABLE)
      .select(
        '*, customer:customers(id,name,lastname), vehicle:vehicles(id,license_plate,brand,model), ' +
        'order_batches:service_order_batches(quantity, cost_at_sale, batch:batches(cost)), ' +
        'order_externals:service_order_external_services(quantity, cost)',
      )
      .order('started_date', { ascending: false });

    if (filters.from) query = query.gte('started_date', filters.from);
    if (filters.to) query = query.lte('started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row: any) => this.toUtilityRow(row));
      }),
    );
  }

  private toUtilityRow(row: any): ServiceOrderUtilityRow {
    const batchesCost = (row.order_batches ?? []).reduce(
      (acc: number, b: any) => acc + (b.cost_at_sale ?? b.batch?.cost ?? 0) * (b.quantity ?? 0),
      0,
    );
    const externalsCost = (row.order_externals ?? []).reduce(
      (acc: number, e: any) => acc + (e.cost ?? 0) * (e.quantity ?? 0),
      0,
    );
    const income = row.total ?? 0;
    const cost = batchesCost + externalsCost;
    return {
      id: row.id,
      number: row.number,
      started_date: row.started_date,
      state: row.state,
      customer: row.customer,
      vehicle: row.vehicle,
      income,
      cost,
      utility: income - cost,
    };
  }

  /**
   * Reporte de Productos / Lotes (reports.md A.2): agrupa
   * service_order_batches por producto en un rango de fechas (filtrado
   * por service_orders.started_date via join !inner, mismo patron que
   * SPBankAccountHistory.getByTransactionKind), sumando cantidad vendida
   * e ingreso (subtotal). Ordenado por cantidad descendente — sirve a la
   * vez como el ranking "que lotes se venden mas" (ver nota de
   * solapamiento con C.6 en reports.md).
   */
  public getProductSalesReport(filters: ProductSalesReportFilters): Observable<ProductSalesReportRow[]> {
    let query = this.supabase
      .from(this.TABLE_BATCHES)
      .select('quantity, subtotal, batch:batches(product_id, product:products(id,name)), service_order:service_orders!inner(started_date)');

    if (filters.from) query = query.gte('service_order.started_date', filters.from);
    if (filters.to) query = query.lte('service_order.started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.groupByProduct(data ?? []);
      }),
    );
  }

  private groupByProduct(rows: any[]): ProductSalesReportRow[] {
    const byProduct = new Map<string, ProductSalesReportRow>();
    for (const row of rows) {
      const productId = row.batch?.product_id;
      if (!productId) continue;
      const existing = byProduct.get(productId);
      if (existing) {
        existing.quantity += row.quantity ?? 0;
        existing.income += row.subtotal ?? 0;
      } else {
        byProduct.set(productId, {
          product_id: productId,
          product_name: row.batch?.product?.name ?? 'Sin producto',
          quantity: row.quantity ?? 0,
          income: row.subtotal ?? 0,
        });
      }
    }
    return Array.from(byProduct.values()).sort((a, b) => b.quantity - a.quantity);
  }

  // Service Order Services
  public addService(item: Omit<ServiceOrderService, 'id' | 'created_at' | 'updated_at'>): Observable<ServiceOrderService> {
    return from(this.supabase.from(this.TABLE_SERVICES).insert([item]).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public bulkAddServices(items: Omit<ServiceOrderService, 'id' | 'created_at' | 'updated_at'>[]): Observable<ServiceOrderService[]> {
    return from(this.supabase.from(this.TABLE_SERVICES).insert(items).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public deleteService(id: string): Observable<void> {
    return from(this.supabase.from(this.TABLE_SERVICES).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // Service Order Batches
  public addBatch(item: Omit<ServiceOrderBatch, 'id' | 'created_at' | 'updated_at'>): Observable<ServiceOrderBatch> {
    return from(this.supabase.from(this.TABLE_BATCHES).insert([item]).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public bulkAddBatches(items: Omit<ServiceOrderBatch, 'id' | 'created_at' | 'updated_at'>[]): Observable<ServiceOrderBatch[]> {
    return from(this.supabase.from(this.TABLE_BATCHES).insert(items).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public deleteBatch(id: string): Observable<void> {
    return from(this.supabase.from(this.TABLE_BATCHES).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // Service Order External Services
  public addExternalService(item: Omit<ServiceOrderExternalService, 'id' | 'created_at' | 'updated_at'>): Observable<ServiceOrderExternalService> {
    return from(this.supabase.from(this.TABLE_EXTERNAL).insert([item]).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  public bulkAddExternalServices(items: Omit<ServiceOrderExternalService, 'id' | 'created_at' | 'updated_at'>[]): Observable<ServiceOrderExternalService[]> {
    return from(this.supabase.from(this.TABLE_EXTERNAL).insert(items).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ?? [];
      }),
    );
  }

  public deleteExternalService(id: string): Observable<void> {
    return from(this.supabase.from(this.TABLE_EXTERNAL).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  public deleteLinesByOrderId(orderId: string): Observable<void> {
    return forkJoin([
      from(this.supabase.from(this.TABLE_SERVICES).delete().eq('service_order_id', orderId))
        .pipe(map(({ error }) => { if (error) throw error; })),
      from(this.supabase.from(this.TABLE_BATCHES).delete().eq('service_order_id', orderId))
        .pipe(map(({ error }) => { if (error) throw error; })),
      from(this.supabase.from(this.TABLE_EXTERNAL).delete().eq('service_order_id', orderId))
        .pipe(map(({ error }) => { if (error) throw error; })),
    ]).pipe(map(() => void 0));
  }
}
