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
  IncomeCompositionTotals,
  ServiceLineReportRow,
  ServiceFrequencyRow,
  MechanicWorkloadRow,
  OrderState,
} from '../../models/service-order.model';
import { Vehicle } from '../../models/vehicle.model';

export interface UtilityReportFilters {
  from?: string;
  to?: string;
}

export interface ProductSalesReportFilters {
  from?: string;
  to?: string;
}

export interface VehicleFrequencyFilters {
  from?: string;
  to?: string;
}

export interface IncomeCompositionFilters {
  from?: string;
  to?: string;
}

export interface ServiceLineReportFilters {
  from?: string;
  to?: string;
  // Estados a incluir — el reporte C.4 solo tiene sentido para
  // COMPLETED/IN_PROGRESS, nunca CANCELED (fuera de su definicion).
  states: Extract<OrderState, 'COMPLETED' | 'IN_PROGRESS'>[];
}

export interface ServiceFrequencyFilters {
  from?: string;
  to?: string;
}

export interface MechanicWorkloadFilters {
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
          .select('*, batch:batches(description, product:products(name)), quote:quotes(number)')
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
   *
   * Tambien trae cost_at_sale (+ fallback batches.cost, igual criterio
   * que getUtilityReport/A.1) para que la misma fila sirva al Reporte de
   * Utilidades por Producto (reports.md C.2) — es un recorte de A.1
   * acotado a repuestos con la MISMA agrupacion por producto que ya
   * calculaba A.2, asi que se generalizo esta query en vez de duplicarla
   * (ver nota en ProductSalesReportRow, service-order.model.ts). A.2 no
   * muestra cost/utility en su tabla, solo los consume la pestaña "Por
   * Producto" de utility-report-dashboard.
   */
  public getProductSalesReport(filters: ProductSalesReportFilters): Observable<ProductSalesReportRow[]> {
    let query = this.supabase
      .from(this.TABLE_BATCHES)
      .select(
        'quantity, subtotal, cost_at_sale, batch:batches(product_id, product:products(id,name), cost), ' +
        'service_order:service_orders!inner(started_date)',
      );

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
      const lineCost = (row.cost_at_sale ?? row.batch?.cost ?? 0) * (row.quantity ?? 0);
      const existing = byProduct.get(productId);
      if (existing) {
        existing.quantity += row.quantity ?? 0;
        existing.income += row.subtotal ?? 0;
        existing.cost += lineCost;
      } else {
        byProduct.set(productId, {
          product_id: productId,
          product_name: row.batch?.product?.name ?? 'Sin producto',
          quantity: row.quantity ?? 0,
          income: row.subtotal ?? 0,
          cost: lineCost,
          utility: 0,
        });
      }
    }
    const result = Array.from(byProduct.values());
    for (const r of result) r.utility = r.income - r.cost;
    return result.sort((a, b) => b.quantity - a.quantity);
  }

  /**
   * Reporte "Servicios mas requeridos" (reports.md C.5): agrupa
   * service_order_services por servicio en un rango de fechas (mismo
   * patron que getProductSalesReport/A.2, pero sobre la tabla de mano de
   * obra — no se reusa el mismo metodo porque son tablas distintas).
   * Ordenado por cantidad descendente (ranking). Sin filtro de estado de
   * orden, mismo criterio que A.2/C.1/C.3 (no excluyen CANCELED).
   */
  public getServiceFrequencyReport(filters: ServiceFrequencyFilters): Observable<ServiceFrequencyRow[]> {
    let query = this.supabase
      .from(this.TABLE_SERVICES)
      .select('quantity, subtotal, service:services(id,name), service_order:service_orders!inner(started_date)');

    if (filters.from) query = query.gte('service_order.started_date', filters.from);
    if (filters.to) query = query.lte('service_order.started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.groupByService((data ?? []) as any[]);
      }),
    );
  }

  private groupByService(rows: any[]): ServiceFrequencyRow[] {
    const byService = new Map<string, ServiceFrequencyRow>();
    for (const row of rows) {
      const serviceId = row.service?.id;
      if (!serviceId) continue;
      const existing = byService.get(serviceId);
      if (existing) {
        existing.quantity += row.quantity ?? 0;
        existing.income += row.subtotal ?? 0;
      } else {
        byService.set(serviceId, {
          service_id: serviceId,
          service_name: row.service?.name ?? 'Sin servicio',
          quantity: row.quantity ?? 0,
          income: row.subtotal ?? 0,
        });
      }
    }
    return Array.from(byService.values()).sort((a, b) => b.quantity - a.quantity);
  }

  /**
   * Reporte "Servicios hechos por tecnico" (reports.md C.7): agrupa
   * lineas de mano de obra por el mecanico de SU ORDEN
   * (service_orders.mechanic_id) — no hay mechanic_id por linea desde la
   * migracion v15, ver nota en MechanicWorkloadRow. orders_count cuenta
   * ordenes distintas (carga de trabajo real), services_count suma
   * quantity de todas las lineas. Sin filtro de estado de orden, mismo
   * criterio que A.2/C.1/C.3/C.5.
   */
  public getMechanicWorkloadReport(filters: MechanicWorkloadFilters): Observable<MechanicWorkloadRow[]> {
    let query = this.supabase
      .from(this.TABLE_SERVICES)
      .select(
        'quantity, subtotal, ' +
        'service_order:service_orders!inner(id, started_date, mechanic:mechanics(id,name,lastname))',
      );

    if (filters.from) query = query.gte('service_order.started_date', filters.from);
    if (filters.to) query = query.lte('service_order.started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.groupByMechanic((data ?? []) as any[]);
      }),
    );
  }

  private groupByMechanic(rows: any[]): MechanicWorkloadRow[] {
    const byMechanic = new Map<string, MechanicWorkloadRow & { orderIds: Set<string> }>();
    for (const row of rows) {
      const order = row.service_order;
      if (!order) continue;
      const mechanic = order.mechanic;
      const key = mechanic?.id ?? 'unassigned';
      let entry = byMechanic.get(key);
      if (!entry) {
        entry = {
          mechanic_id: mechanic?.id ?? null,
          mechanic_name: mechanic ? [mechanic.name, mechanic.lastname].filter(Boolean).join(' ') : 'Sin asignar',
          orders_count: 0,
          services_count: 0,
          income: 0,
          orderIds: new Set<string>(),
        };
        byMechanic.set(key, entry);
      }
      entry.orderIds.add(order.id);
      entry.services_count += row.quantity ?? 0;
      entry.income += row.subtotal ?? 0;
    }
    return Array.from(byMechanic.values())
      .map(({ orderIds, ...rest }) => ({ ...rest, orders_count: orderIds.size }))
      .sort((a, b) => b.services_count - a.services_count);
  }

  /**
   * Reporte "Que tipo de vehiculo/marca/año entra mas" (reports.md C.1):
   * una fila por cada orden con vehiculo asignado en el rango de fechas
   * (started_date), con brand/model/year del vehiculo. La agrupacion por
   * marca/modelo/año y su normalizacion (vehicles.brand/model/year son
   * texto libre, no catalogo) se hacen en el cliente (componente), no
   * aqui — este metodo solo trae las filas crudas.
   */
  public getVehicleFrequency(filters: VehicleFrequencyFilters): Observable<Pick<Vehicle, 'brand' | 'model' | 'year'>[]> {
    let query = this.supabase
      .from(this.TABLE)
      .select('vehicle:vehicles(brand,model,year)')
      .not('vehicle_id', 'is', null);

    if (filters.from) query = query.gte('started_date', filters.from);
    if (filters.to) query = query.lte('started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? [])
          .map((row: any) => row.vehicle as Pick<Vehicle, 'brand' | 'model' | 'year'> | null)
          .filter((v): v is Pick<Vehicle, 'brand' | 'model' | 'year'> => v !== null);
      }),
    );
  }

  /**
   * Reporte de Composicion de Ingresos (reports.md C.3): suma el
   * subtotal de las 3 fuentes de ingreso de una orden (mano de obra,
   * repuestos, servicios externos) a traves de TODAS las ordenes en el
   * rango de fechas (started_date) — un solo agregado del sistema, no
   * por orden ni por producto. No hay un metodo hermano con esta forma
   * (ni A.1 ni A.2 suman las 3 fuentes por separado a este nivel), asi
   * que se creo uno nuevo en vez de reusar/generalizar otro.
   */
  public getIncomeComposition(filters: IncomeCompositionFilters): Observable<IncomeCompositionTotals> {
    let query = this.supabase
      .from(this.TABLE)
      .select(
        'order_services:service_order_services(subtotal), ' +
        'order_batches:service_order_batches(subtotal), ' +
        'order_externals:service_order_external_services(subtotal)',
      );

    if (filters.from) query = query.gte('started_date', filters.from);
    if (filters.to) query = query.lte('started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const totals: IncomeCompositionTotals = { labor: 0, parts: 0, external: 0 };
        for (const row of (data ?? []) as any[]) {
          totals.labor += (row.order_services ?? []).reduce((acc: number, s: any) => acc + (s.subtotal ?? 0), 0);
          totals.parts += (row.order_batches ?? []).reduce((acc: number, b: any) => acc + (b.subtotal ?? 0), 0);
          totals.external += (row.order_externals ?? []).reduce((acc: number, e: any) => acc + (e.subtotal ?? 0), 0);
        }
        return totals;
      }),
    );
  }

  /**
   * Reporte de Servicios por Estado (reports.md C.4): listado plano (sin
   * agregar) de lineas de mano de obra cuya orden esta en alguno de los
   * estados seleccionados (solo COMPLETED/IN_PROGRESS tienen sentido
   * aqui — nunca CANCELED, fuera del alcance de este reporte) y cuyo
   * started_date cae en el rango de fechas. Seguimiento operativo (carga
   * de trabajo), no financiero — por eso no trae price/subtotal.
   */
  public getServiceLinesReport(filters: ServiceLineReportFilters): Observable<ServiceLineReportRow[]> {
    let query = this.supabase
      .from(this.TABLE_SERVICES)
      .select(
        'id, quantity, service:services(name), ' +
        'service_order:service_orders!inner(id,number,state,started_date,ended_date,' +
        'customer:customers(name,lastname), vehicle:vehicles(license_plate,brand,model), ' +
        'mechanic:mechanics(name,lastname))',
      )
      .in('service_order.state', filters.states);

    if (filters.from) query = query.gte('service_order.started_date', filters.from);
    if (filters.to) query = query.lte('service_order.started_date', filters.to);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return ((data ?? []) as any[])
          .map((row): ServiceLineReportRow => {
            const order = row.service_order ?? {};
            const customer = order.customer;
            const vehicle = order.vehicle;
            const mechanic = order.mechanic;
            return {
              id: row.id,
              service_name: row.service?.name ?? 'Sin servicio',
              quantity: row.quantity ?? 0,
              order_id: order.id,
              order_number: order.number ?? null,
              order_state: order.state,
              started_date: order.started_date ?? null,
              ended_date: order.ended_date ?? null,
              customer_name: customer ? [customer.name, customer.lastname].filter(Boolean).join(' ') : '—',
              vehicle_label: vehicle
                ? [vehicle.brand, vehicle.model, vehicle.license_plate].filter(Boolean).join(' ')
                : '—',
              mechanic_name: mechanic ? [mechanic.name, mechanic.lastname].filter(Boolean).join(' ') : '—',
            };
          })
          .sort((a, b) => (b.started_date ?? '').localeCompare(a.started_date ?? ''));
      }),
    );
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
