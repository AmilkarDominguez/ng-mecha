import { EntityState } from './product-category.model';
import { Customer } from './customer.model';
import { Vehicle } from './vehicle.model';

export type OrderState = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type PaymentType = 'CASH' | 'CREDIT';
export type DeliveryTime = 'ORDER' | 'IMMEDIATE';

export interface ServiceOrder {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  mechanic_id: string | null;
  user_id: string | null;
  number: string | null;
  description: string | null;
  total: number | null;
  have: number | null;
  must: number | null;
  iva: number | null;
  total_iva: number | null;
  with_iva: boolean;
  mileage: string | null;
  draft_expiration_date: string | null;
  started_date: string | null;
  ended_date: string | null;
  return_date: string | null;
  state: OrderState;
  payment_type: PaymentType;
  created_at?: string | Date;
  updated_at?: string | Date;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface ServiceOrderService {
  id: string;
  service_id: string | null;
  service_order_id: string | null;
  quote_id: string | null;
  discount: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderBatch {
  id: string;
  batch_id: string | null;
  service_order_id: string | null;
  quote_id: string | null;
  quantity: number | null;
  delivery_time: DeliveryTime;
  price: number | null;
  discount: number | null;
  subtotal: number | null;
  cost_at_sale: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderExternalService {
  id: string;
  external_service_id: string | null;
  service_order_id: string | null;
  bank_account_id: string | null;
  quote_id: string | null;
  cost: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderServiceRow extends ServiceOrderService {
  service_name: string;
}

export interface ServiceOrderBatchRow extends ServiceOrderBatch {
  product_name: string;
  industry_name: string;
}

export interface ServiceOrderExternalServiceRow extends ServiceOrderExternalService {
  external_service_name: string;
}

export interface OrderServiceLine {
  id: string;
  service_id: string | null;
  quote_id: string | null;
  price: number | null;
  quantity: number | null;
  discount: number | null;
  subtotal: number | null;
  service: { name: string | null; code: string | null } | null;
  quote: { number: string | null } | null;
}

export interface OrderBatchLine {
  id: string;
  batch_id: string | null;
  quote_id: string | null;
  price: number | null;
  quantity: number | null;
  discount: number | null;
  subtotal: number | null;
  cost_at_sale: number | null;
  delivery_time: DeliveryTime;
  batch: {
    description: string | null;
    product: { name: string | null } | null;
    industry: { name: string | null } | null;
  } | null;
  quote: { number: string | null } | null;
}

export interface OrderExternalLine {
  id: string;
  external_service_id: string | null;
  bank_account_id: string | null;
  quote_id: string | null;
  cost: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  external_service: { name: string | null; company_name: string | null } | null;
  quote: { number: string | null } | null;
}

export interface ServiceOrderWithLines extends ServiceOrder {
  mechanic: { id: string; name: string | null; lastname: string | null } | null;
  user: { id: string; name: string | null; lastname: string | null } | null;
  order_services: OrderServiceLine[];
  order_batches: OrderBatchLine[];
  order_externals: OrderExternalLine[];
}

// Fila calculada para el Reporte de Utilidades (reports.md A.1). income =
// service_orders.total (sin IVA — el IVA no es ganancia del taller, es un
// impuesto de paso). cost = suma de costos de repuestos (cost_at_sale,
// con fallback a batches.cost para lineas anteriores a esa columna) +
// costo de servicios externos. La mano de obra no tiene costo asociado:
// es 100% utilidad.
export interface ServiceOrderUtilityRow {
  id: string;
  number: string | null;
  started_date: string | null;
  state: OrderState;
  customer: { id: string; name: string | null; lastname: string | null } | null;
  vehicle: { id: string; license_plate: string | null; brand: string | null; model: string | null } | null;
  income: number;
  cost: number;
  utility: number;
}

// Fila agregada para el Reporte de Productos / Lotes (reports.md A.2):
// una fila por producto, con la cantidad total vendida y el ingreso
// generado (suma de subtotal) a traves de todas sus lineas de
// service_order_batches en el rango de fechas. Ordenado por cantidad
// descendente por defecto, lo que tambien sirve como el ranking "que
// lotes se venden mas por producto" (C.6) — ver nota de solapamiento en
// reports.md, no se implemento un reporte C.6 separado.
//
// cost/utility (agregados en la misma fila, no un tipo aparte) reutilizan
// cost_at_sale — reports.md C.2 ("¿Cuanto estoy ganando por productos?")
// es un recorte de A.1 acotado a repuestos, con la MISMA agrupacion por
// producto que A.2 ya calculaba; en vez de duplicar la query se extendio
// esta fila y SPServiceOrder.getProductSalesReport() con estos 2 campos.
// A.2 (product-sales-report-dashboard) no los muestra — solo los usa la
// pestaña "Por Producto" del Reporte de Utilidades (C.2).
export interface ProductSalesReportRow {
  product_id: string;
  product_name: string;
  quantity: number;
  income: number;
  cost: number;
  utility: number;
}

// Totales para el Reporte de Composicion de Ingresos (reports.md C.3):
// suma de subtotal de las 3 fuentes de ingreso de una orden (mano de
// obra, repuestos, servicios externos) a traves de TODAS las ordenes en
// el rango de fechas — no es por orden ni por producto, es un solo
// agregado del sistema. El componente calcula el % de cada categoria
// sobre el total (labor + parts + external).
export interface IncomeCompositionTotals {
  labor: number;
  parts: number;
  external: number;
}

// Fila plana (una por linea de mano de obra, sin agregar) para el
// Reporte de Servicios por Estado (reports.md C.4): seguimiento
// operativo de que servicios se prestaron (COMPLETED) o siguen
// pendientes (IN_PROGRESS) en un rango de fechas — nunca incluye
// ordenes CANCELED, ese tercer estado esta fuera del alcance de este
// reporte segun su propia definicion.
export interface ServiceLineReportRow {
  id: string;
  service_name: string;
  quantity: number;
  order_id: string;
  order_number: string | null;
  order_state: OrderState;
  started_date: string | null;
  ended_date: string | null;
  customer_name: string;
  vehicle_label: string;
  mechanic_name: string;
}

// Fila agregada para el Reporte "Servicios mas requeridos" (reports.md
// C.5): mismo patron que ProductSalesReportRow (A.2) pero agrupando
// service_order_services por servicio en vez de service_order_batches
// por producto — no se reusa el mismo metodo porque son tablas
// distintas, pero sigue la misma forma (quantity = frecuencia de uso,
// income = subtotal sumado). Sin filtro de estado de orden, igual
// criterio que A.2/C.1/C.3 (ninguno excluye CANCELED, solo filtran por
// fecha) — mantenido por consistencia, no por descuido.
export interface ServiceFrequencyRow {
  service_id: string;
  service_name: string;
  quantity: number;
  income: number;
}

// Fila agregada para el Reporte "Servicios hechos por tecnico"
// (reports.md C.7): agrupa lineas de mano de obra por el mecanico de SU
// ORDEN (service_orders.mechanic_id), no por linea — desde la migracion
// v15 (service-order-single-mechanic) el mecanico es 1 por orden
// completa, no por servicio individual, asi que si una orden tuvo 3
// lineas de mano de obra distintas, las 3 se atribuyen al unico
// mecanico de esa orden aunque en la realidad las hubiera hecho gente
// distinta. No es un bug de este reporte, es una limitacion aceptada
// del modelo (ver [[service-order-flow]] regla de negocio #3).
// orders_count = ordenes distintas atribuidas (carga de trabajo real),
// services_count = suma de quantity de todas sus lineas de mano de obra.
export interface MechanicWorkloadRow {
  mechanic_id: string | null;
  mechanic_name: string;
  orders_count: number;
  services_count: number;
  income: number;
}
