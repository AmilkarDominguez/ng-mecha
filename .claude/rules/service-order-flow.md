Regla de referencia del módulo de Órdenes de Servicio — estado actual del código.

Utiliza un razonamiento: adaptive thinking

**Instrucción:** Lee este documento completamente antes de tocar cualquier archivo del módulo `service-order`. Captura el estado real implementado, las reglas de negocio activas, las dependencias entre componentes y los invariantes que NO deben romperse al modificar el módulo.

Para todo lo relacionado a **Cotizaciones** (tab "Cotizaciones", `AddQuoteToOrderModal`, `quote_id` en las tablas pivote, RPCs de conversión) usa **[[quotes-service-orders]]** como fuente principal — aquí solo se resume lo mínimo para no duplicar.

---

# Módulo: Órdenes de Servicio (`service-order`)

## Rutas

| URL | Componente |
|-----|-----------|
| `/dashboard/ordenes/en-curso` | `ServiceOrderDashboard` |
| `/dashboard/ordenes/nueva` | `ServiceOrderForm` (modo creación) |
| `/dashboard/ordenes/editar/:id` | `ServiceOrderForm` (modo edición — mismo componente, `isEditMode()` según haya `:id`) |

Todas bajo `AdminLayout` con lazy loading en `src/app/app.routes.ts`. El dashboard tiene una sola entrada de menú ("En Curso") en `nav-menu.ts` — no hay entradas separadas para Completadas/Canceladas, el filtro es solo dentro del propio listado (mismo patrón simplificado que "Cotizaciones").

---

## Estructura de archivos

```
src/app/features/service-order/
├── service-order-form/                        ← Formulario de creación/edición
│   ├── service-order-form.ts
│   ├── service-order-form.html
│   └── service-order-form.scss
├── service-order-dashboard/                    ← Listado + búsqueda + acciones
│   ├── service-order-dashboard.ts
│   ├── service-order-dashboard.html
│   └── service-order-dashboard.scss
└── components/
    ├── tab-customer/                           ← Tab 1: cliente, vehículo, mecánico, fechas
    ├── tab-labor/                               ← Tab 2: mano de obra (servicios)
    ├── tab-parts/                               ← Tab 3: repuestos e insumos (lotes)
    ├── tab-external/                            ← Tab 4: trabajos adicionales
    ├── tab-quote/                                ← Tab 5: cotizaciones aprobadas (buscar + preview + agregar)
    ├── service-order-services-table/            ← Tabla editable inline de mano de obra
    ├── service-order-batches-table/             ← Tabla editable inline de repuestos
    ├── service-order-external-services-table/   ← Tabla editable inline de externos
    ├── service-order-quotes-table/              ← Tabla de cotizaciones agregadas (solo lectura + quitar)
    ├── service-order-detail-modal/              ← Modal de detalle de orden (readonly, con botón "Agregar Cotización")
    ├── add-quote-to-order-modal/                ← Modal para agregar cotización a una orden IN_PROGRESS ya existente
    ├── service-order-print-modal/               ← Modal de impresión (Hoja de Servicios)
    ├── service-order-payments-modal/            ← Modal: lista de pagos + acciones (registrar/editar/eliminar)
    ├── service-order-payment-form-modal/        ← Modal: formulario de un pago (crear/editar)
    └── service-order-payment-delete-confirm-modal/ ← Modal: confirmación antes de eliminar un pago
```

`tab-quote`, `service-order-quotes-table` y `add-quote-to-order-modal` son del módulo de
Cotizaciones — ver [[quotes-service-orders]] §6 para su comportamiento detallado. Los demás
(`service-order-print-modal`, `service-order-payments-modal`,
`service-order-payment-form-modal`, `service-order-payment-delete-confirm-modal`) son de un
módulo de pagos/impresión anterior a Cotizaciones, documentados en la sección §9 de este
archivo.

---

## Base de datos

### `service_orders` (tabla principal)

| Columna               | Tipo                   | Notas |
|-----------------------|------------------------|-------|
| id                    | UUID PK                | auto |
| customer_id           | UUID FK → customers    | NOT NULL |
| vehicle_id            | UUID FK → vehicles     | nullable, ON DELETE SET NULL |
| mechanic_id           | UUID FK → mechanics    | nullable, ON DELETE SET NULL |
| user_id               | UUID FK → users        | nullable, ON DELETE SET NULL — quién registró la orden (ver §7) |
| number                | TEXT                   | nullable — código identificador |
| description           | TEXT                   | nullable — recomendaciones/diagnóstico |
| total                 | NUMERIC(10,2)          | suma de subtotales de las 3 tablas pivote |
| have                  | NUMERIC(10,2)          | pagado acumulado (default 0, lo mueven las RPCs de pago) |
| must                  | NUMERIC(10,2)          | saldo pendiente |
| iva                   | NUMERIC(10,2)          | nullable — 13% si `with_iva` |
| total_iva             | NUMERIC(10,2)          | nullable — total + iva |
| with_iva              | BOOLEAN                | default false |
| mileage               | TEXT                   | nullable — kilometraje del vehículo |
| draft_expiration_date | DATE                   | nullable — no usado aún en UI |
| started_date          | DATE                   | nullable — fecha de ingreso |
| ended_date            | DATE                   | nullable — fecha de salida |
| return_date           | DATE                   | nullable — fecha de retorno sugerida |
| state                 | order_state_enum       | default IN_PROGRESS |
| payment_type          | payment_type_enum      | default CASH |
| created_at            | TIMESTAMPTZ            | auto |
| updated_at            | TIMESTAMPTZ            | auto (trigger) |

**Enums SQL:**
- `order_state_enum`: `IN_PROGRESS`, `COMPLETED`, `CANCELED`
- `payment_type_enum`: `CASH`, `CREDIT`

> No existe `service_orders.quote_id` de cabecera — la relación con cotizaciones es N:1 vía
> `quotes.converted_service_order_id` + `quote_id` a nivel de línea. Ver [[quotes-service-orders]] §1.

### `service_order_services` (mano de obra)

| Columna          | Tipo            | Notas |
|------------------|-----------------|-------|
| id               | UUID PK         | auto |
| service_id       | UUID FK → services | nullable, ON DELETE SET NULL |
| service_order_id | UUID FK → service_orders | ON DELETE CASCADE |
| quote_id         | UUID FK → quotes | nullable, ON DELETE SET NULL — cotización de origen (`null` = línea agregada directo en la orden) |
| discount         | NUMERIC(8,2)    | porcentaje 0-100 |
| price            | NUMERIC(8,2)    | precio del servicio |
| quantity         | NUMERIC         | cantidad |
| subtotal         | NUMERIC(8,2)    | (price × quantity) − (price × quantity × discount/100) |

> ⚠️ **mechanic_id fue eliminado** de esta tabla (migración v15). El mecánico es único por orden, no por línea.

### `service_order_batches` (repuestos e insumos)

| Columna          | Tipo                 | Notas |
|------------------|----------------------|-------|
| id               | UUID PK              | auto |
| batch_id         | UUID FK → batches    | nullable, ON DELETE SET NULL |
| service_order_id | UUID FK → service_orders | ON DELETE CASCADE |
| quote_id         | UUID FK → quotes     | nullable, ON DELETE SET NULL |
| quantity         | NUMERIC              | cantidad |
| delivery_time    | delivery_time_enum   | default IMMEDIATE |
| price            | NUMERIC(8,2)         | precio de venta |
| discount         | NUMERIC(8,2)         | porcentaje 0-100 |
| subtotal         | NUMERIC(8,2)         | (price × quantity) − (price × quantity × discount/100) |

**Enum:** `delivery_time_enum`: `IMMEDIATE` (Inmediato) · `ORDER` (Pedido)

### `service_order_external_services` (trabajos adicionales)

| Columna             | Tipo                 | Notas |
|---------------------|----------------------|-------|
| id                  | UUID PK              | auto |
| external_service_id | UUID FK → external_services | nullable, ON DELETE SET NULL |
| service_order_id    | UUID FK → service_orders | ON DELETE CASCADE |
| bank_account_id     | UUID FK → bank_accounts | nullable, ON DELETE SET NULL — si se define, dispara un egreso (ver §9) |
| quote_id            | UUID FK → quotes     | nullable, ON DELETE SET NULL |
| cost                | NUMERIC(8,2)         | costo al taller |
| price               | NUMERIC(8,2)         | precio al cliente |
| quantity            | NUMERIC              | cantidad |
| subtotal            | NUMERIC(8,2)         | price × quantity (sin descuento) |

---

## Modelos TypeScript

**Archivo:** `src/app/core/models/service-order.model.ts`

```typescript
type OrderState   = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
type PaymentType  = 'CASH' | 'CREDIT';
type DeliveryTime = 'ORDER' | 'IMMEDIATE';

interface ServiceOrder {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  mechanic_id: string | null;      // ← un mecánico por orden (no por servicio)
  user_id: string | null;
  number: string | null;
  description: string | null;
  total: number | null;
  have: number | null;             // pagado
  must: number | null;             // saldo
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
  customer?: Customer;             // join disponible en get()/getById()/getWithLines()
  vehicle?: Vehicle;               // join disponible en get()/getById()/getWithLines()
}

// Interfaces pivot — TODAS con quote_id (nullable) desde la corrección de trazabilidad
interface ServiceOrderService         { id, service_id, service_order_id, quote_id, discount, price, quantity, subtotal, ... }
interface ServiceOrderBatch           { id, batch_id, service_order_id, quote_id, quantity, delivery_time, price, discount, subtotal, ... }
interface ServiceOrderExternalService { id, external_service_id, service_order_id, bank_account_id, quote_id, cost, price, quantity, subtotal, ... }

// Rows usadas en memoria durante formulario (incluyen nombre para mostrar)
interface ServiceOrderServiceRow  extends ServiceOrderService  { service_name: string }
interface ServiceOrderBatchRow    extends ServiceOrderBatch    { product_name: string; industry_name: string }
interface ServiceOrderExternalServiceRow extends ServiceOrderExternalService { external_service_name: string }

// Interfaces para vista de detalle (con joins anidados) — también con quote_id + quote.number
interface OrderServiceLine  { id, service_id, quote_id, price, quantity, discount, subtotal, service: {name, code} | null, quote: {number} | null }
interface OrderBatchLine    { id, batch_id, quote_id, price, quantity, discount, subtotal, delivery_time, batch: {description, product: {name} | null, industry: {name} | null} | null, quote: {number} | null }
interface OrderExternalLine { id, external_service_id, bank_account_id, quote_id, cost, price, quantity, subtotal, external_service: {name, company_name} | null, quote: {number} | null }

interface ServiceOrderWithLines extends ServiceOrder {
  mechanic: { id: string; name: string | null; lastname: string | null } | null;
  user: { id: string; name: string | null; lastname: string | null } | null;
  order_services: OrderServiceLine[];
  order_batches: OrderBatchLine[];
  order_externals: OrderExternalLine[];
}
```

> **Regla crítica de trazabilidad:** si agregas un campo nuevo a una tabla pivote de orden,
> agrégalo también aquí y en los 3 puntos de guardado/carga de `service-order-form.ts`
> (`toXRow`, `saveLines()`) — de lo contrario el patrón delete-all + re-insert-all de
> `executeUpdate()` lo borra silenciosamente al editar. Ver [[quotes-service-orders]] §5 (fue
> exactamente el bug que tenía `quote_id` antes de esta corrección).

---

## Servicio Supabase

**Archivo:** `src/app/core/services/supabase/sb-service-order.ts`
**Clase:** `SPServiceOrder` — `providedIn: 'root'`

### Métodos sobre `service_orders`

| Método | Devuelve | Descripción |
|--------|----------|-------------|
| `get()` | `Observable<ServiceOrder[]>` | Todas las órdenes con join a customers y vehicles. Order: `created_at DESC` |
| `getById(id)` | `Observable<ServiceOrder>` | Una orden por ID con join a customers y vehicles |
| `getWithLines(id)` | `Observable<ServiceOrderWithLines>` | `forkJoin`: orden (+ join mechanic + user) + 3 tablas pivote, cada una con sus joins de nombre **y** `quote:quotes(number)`. Usado por el modal de detalle, el modal de impresión y el formulario en modo edición |
| `add(item)` | `Observable<ServiceOrder>` | Inserta la orden y retorna el registro completo (incluye id generado) |
| `update(item)` | `Observable<ServiceOrder>` | Actualiza orden por id (destructura `customer`/`vehicle` fuera del payload) |
| `delete(id)` | `Observable<void>` | Elimina orden |
| `listen()` | `Observable<ServiceOrder[]>` | `BehaviorSubject` + canal realtime `service-orders-changes` de Supabase |

### Métodos sobre tablas pivote

| Método | Descripción |
|--------|-------------|
| `bulkAddServices(items[])` / `bulkAddBatches(items[])` / `bulkAddExternalServices(items[])` | Inserta varias filas de una vez (usados por `saveLines()`) |
| `addService` / `addBatch` / `addExternalService` | Inserta una sola fila (poco usados) |
| `deleteService` / `deleteBatch` / `deleteExternalService` | Elimina una fila por id |
| `deleteLinesByOrderId(orderId)` | `forkJoin` de 3 `DELETE ... WHERE service_order_id = orderId` (una por tabla pivote). Se llama al editar, **después** de revertir los egresos de servicios externos (ver §9) y **antes** de `saveLines()` |

---

## Componente: `ServiceOrderForm`

**Ubicación:** `service-order-form/service-order-form.ts`
**Ruta:** `/dashboard/ordenes/nueva` (creación) y `/dashboard/ordenes/editar/:id` (edición) — mismo componente para ambos casos.

### Estado (signals)

```typescript
isEditMode      = signal(false)
editOrderId     = signal<string | null>(null)
loading         = signal(false)
originalUserId  = signal<string | null>(null)   // preserva quién registró la orden al editar (ver §7)

customerTabValue = signal<CustomerTabValue | null>(null)
serviceRows      = signal<ServiceOrderServiceRow[]>([])
batchRows        = signal<ServiceOrderBatchRow[]>([])
externalRows     = signal<ServiceOrderExternalServiceRow[]>([])
selectedQuotes   = signal<Quote[]>([])          // cotizaciones a convertir al guardar (ver [[quotes-service-orders]])
```

### Cálculos (computed)

```typescript
subtotalServices = computed(() => serviceRows().reduce( (precio × qty) - (precio × qty × desc/100), 0 ))
subtotalBatches  = computed(() => batchRows().reduce( igual fórmula, 0 ))
subtotalExternal = computed(() => externalRows().reduce( precio × qty, 0 ))  // sin descuento
subtotalQuotes   = computed(() => selectedQuotes().reduce( q.total, 0 ))     // SOLO informativo, no entra en total()
total            = computed(() => subtotalServices() + subtotalBatches() + subtotalExternal())
ivaAmount        = computed(() => with_iva ? total() × 0.13 : 0)
totalWithIva     = computed(() => total() + ivaAmount())
selectedQuoteIds = computed(() => selectedQuotes().map(q => q.id))
```

`subtotalQuotes()` **no** se suma a `total()`/`payload.total`: el total real de la orden lo
recalcula `convert_quote_to_order()` desde cero (todas sus líneas) al procesar cada
cotización en `finalizeWithQuotes()`. Sumarlo aquí también duplicaría el monto.

### FormGroup `summaryForm`

```typescript
{
  number:       FormControl<string>('')              // número de orden (opcional)
  payment_type: FormControl<'CASH'|'CREDIT'>('CASH')
  with_iva:     FormControl<boolean>(false)
  description:  FormControl<string>('')              // recomendaciones/observaciones
  return_date:  FormControl<Date|null>(null)
}
```

### `ngOnInit()` — dos entradas distintas

1. **`:id` presente** (edición): `isEditMode.set(true)`, `getWithLines(id)` → carga
   `summaryForm`, `customerTabValue` (sin campo de cotizaciones — `selectedQuotes` queda
   vacío, no se reconstruye qué cotizaciones originaron las líneas existentes), y convierte
   las 3 listas de líneas con `toServiceRow`/`toBatchRow`/`toExternalRow` (preservando
   `quote_id` de cada una). `originalUserId` guarda el `user_id` original para no
   sobrescribirlo al guardar (ver §7).
2. **`?quoteId=` presente y sin `:id`** (deep link desde `quote-dashboard.onConvert()`):
   `SPQuote.getById(quoteId)` precarga `customer_id`/`vehicle_id` en `customerTabValue` y
   agrega esa cotización a `selectedQuotes` directamente (sin pasar por la búsqueda del tab
   Cotizaciones).

### Flujo de guardado `onSave()`

1. Valida: `customerTabValue()?.customer_id` debe existir → snackbar de error y abort.
2. Construye `payload` con todos los campos de `service_orders` (`have: 0` siempre al
   construir el payload — en edición esto es luego ignorado en la UI por `must`/`have`
   reales que gestionan las RPCs de pago, no este formulario).
3. Si `isEditMode()` → `executeUpdate(editOrderId, payload)`; si no → `executeCreate(payload)`.

**`executeCreate`:** `serviceOrderProvider.add(payload)` → con el `order.id` obtenido, llama
`saveLines()`.

**`executeUpdate`:** `serviceOrderProvider.update(...)` → **luego**
`externalExpenseService.reverseForOrder(orderId)` (revierte TODOS los egresos de servicios
externos de la orden antes de que sus líneas desaparezcan — ver §9) → **luego**
`deleteLinesByOrderId(orderId)` → **luego** `saveLines()`. Si falla la reversión de egresos,
la orden **no se actualiza** (el error se muestra y no se continúa la cascada).

**`saveLines(orderId, successMessage)`:** arma `servicesToSave`/`batchesToSave`/`externalToSave`
(incluyendo `quote_id` de cada fila) y dispara los `bulkAdd*` que correspondan en paralelo
(contador `pending`, no `forkJoin`). El `bulkAddExternalServices` encadena
`applyExternalExpenses()` (aplica el RPC de egreso por cada línea externa con
`bank_account_id`, ver §9). Cuando todo termina → `finalizeWithQuotes(orderId, successMessage)`.

**`finalizeWithQuotes(orderId, successMessage)`:** si `selectedQuoteIds()` está vacío, solo
muestra el snackbar y navega. Si no, encadena `SPQuoteConversion.convertToOrder(quoteId,
orderId)` por cada una con `concatMap` (nunca `forkJoin` — ver [[quotes-service-orders]] §3/§6).

**Campo `must` en el payload:** siempre = `totalWithIva()` en creación (el saldo comienza
igual al total; en edición el valor real de `must`/`have` lo gestionan las RPCs de pago de
§9, no este payload — pero el formulario igual lo reenvía en cada guardado, así que **evita
editar una orden con pagos ya registrados sin considerar que `must` se recalculará** desde
`totalWithIva()` y no desde el saldo real pendiente; hoy esto es una limitación conocida, no
un bug a "arreglar" sin antes coordinar con el flujo de pagos).
**Campo `have`:** siempre = `0` en el payload del formulario (los pagos reales se registran
aparte, vía `ServiceOrderPaymentsModal` → RPCs `register/edit/delete_service_order_payment`).

---

## Componente: `TabCustomer`

**Selector:** `app-tab-customer`
**Output:** `valueChange: output<CustomerTabValue>()`

### Interface emitida

```typescript
interface CustomerTabValue {
  customer_id: string | null;
  vehicle_id:  string | null;
  mechanic_id: string | null;
  mileage:     string | null;
  started_date: string | null;
  ended_date:   string | null;
}
```

> ⚠️ `number` está en el `summaryForm` del formulario principal, no aquí.
> ⚠️ **Ya no tiene nada de cotizaciones.** El campo `quote_ids` que existía aquí (mat-select
> multi de cotizaciones `APPROVED`) se eliminó por completo y se movió al tab dedicado
> `tab-quote` + al `ngOnInit()` de `service-order-form.ts` (para el flujo `?quoteId=`). Si ves
> código, un skill o una doc vieja que mencione un selector de cotizaciones dentro de
> `tab-customer`, está desactualizado — ver [[quotes-service-orders]] §6.

### FormControls de autocomplete

- `customerCtrl` — busca clientes. Al seleccionar: carga vehículos del cliente, resetea vehículo
- `vehicleCtrl` — muestra solo vehículos `ACTIVE` del cliente seleccionado
- `mechanicCtrl` — filtra mecánicos `ACTIVE` globales

### FormGroup `form`

```typescript
{ mileage: string, started_date: Date|null, ended_date: Date|null }
```

### Botón de registro rápido

`openNewCustomerDialog()` — abre `CustomerFormModal` con `{ hasBackdrop: false, panelClass: 'floating-dialog-panel', data: {} }`, al cerrar llama `SPCustomer.add()` y selecciona el cliente nuevo en el autocomplete.

---

## Componente: `TabLabor`

**Selector:** `app-tab-labor`
**Output:** `addItem: output<ServiceOrderServiceRow>()`

- Filtra servicios `ACTIVE` en autocomplete
- Al seleccionar servicio: habilita campos de precio/cantidad y auto-rellena el precio base
- `onAdd()` genera `crypto.randomUUID()` como id temporal de fila, descuento default = 0, **`quote_id: null` explícito** (línea agregada manualmente, sin cotización de origen)
- `openNewServiceDialog()` — crea servicio rápido con `ServiceFormModal`

> ⚠️ **El mecánico NO se selecciona aquí.** El selector de mecánico está en Tab 1 (`tab-customer`).

---

## Componente: `TabParts`

**Selector:** `app-tab-parts`
**Output:** `addItem: output<ServiceOrderBatchRow>()`

- Búsqueda por texto libre (mín. 2 caracteres), retorna máx. 8 resultados
- Busca en: `product.name`, `description`, `code`, `compatible_brands`, `compatible_models`
- Solo lotes con `state === 'ACTIVE'`
- Usa `batches.stock` directo (a diferencia de `tab-parts` de **cotización**, que usa
  `batch_available_stock` — ver [[quotes-service-orders]] §1/§6). Este tab es para líneas que
  entran directo a una orden ya `IN_PROGRESS`, no reservas.
- `openNewBatchDialog()` — crea lote rápido con `BatchFormModal`. Requiere inyectar `SPProduct`, `SPWarehouse`, `SPSupplier`, `SPIndustry`, `SPBrand` en el tab para pasar como data al modal
- `delivery_time` default: `IMMEDIATE`
- `onAdd()` emite `quote_id: null` explícito (igual que `tab-labor`)

---

## Componente: `TabExternal`

**Selector:** `app-tab-external`
**Output:** `addItem: output<ServiceOrderExternalServiceRow>()`

- Filtra servicios externos `ACTIVE`
- Al seleccionar: habilita campos de costo/precio/cantidad/bank_account
- `bank_account_id` es opcional (nullable) — si se define, la orden generará un egreso al guardar (ver §9)
- Subtotal = `price × quantity` (sin descuento)
- `openNewExternalServiceDialog()` — crea servicio externo rápido con `ExternalServiceFormModal`
- `onAdd()` emite `quote_id: null` explícito (igual que `tab-labor`/`tab-parts`)

---

## Componente: `TabQuote`

Ver [[quotes-service-orders]] §6 — resumen: autocomplete de cotizaciones `APPROVED` filtradas
por `customerId`/`vehicleId` (inputs) y `excludeIds` (ya agregadas a esta orden); al elegir
una carga su preview completo (`SPQuote.getWithLines()`) antes de habilitar "Agregar a la
Orden"; solo al confirmar emite `addQuote: output<Quote>()`. No inserta nada por sí mismo —
la conversión real ocurre en `finalizeWithQuotes()` al guardar la orden.

---

## Tablas editables inline / de solo lectura

Todas comparten un patrón similar (mismo `table-wrapper`/`detail-table` de Angular Material):

| Componente | Input | Output | Descripción editable |
|---|---|---|---|
| `ServiceOrderServicesTable` | `items: ServiceOrderServiceRow[]` | `removeItem: string` | precio, cantidad, descuento% |
| `ServiceOrderBatchesTable` | `items: ServiceOrderBatchRow[]` | `removeItem: string` | precio, cantidad, descuento%, delivery_time |
| `ServiceOrderExternalServicesTable` | `items: ServiceOrderExternalServiceRow[]` | `removeItem: string` | costo, precio, cantidad |
| `ServiceOrderQuotesTable` | `items: Quote[]` | `removeItem: string` | solo lectura (número, vencimiento, total) + quitar |

- Los cambios en las 3 primeras son **directos sobre el objeto** de la fila (mutación local del array reactivo)
- El computed `subtotalX()` en el formulario principal recalcula en cada cambio
- El descuento se limita a 0-100 con `Math.min(100, Math.max(0, d))`
- La eliminación dispara snackbar de confirmación en todas
- `ServiceOrderQuotesTable` no tiene celdas editables — quitar una cotización de la lista antes de guardar simplemente evita que se convierta, no revierte nada (porque nada se convirtió aún)

---

## Componente: `ServiceOrderDashboard`

- Usa `listen()` para actualización en tiempo real
- Búsqueda filtra por `number` y `customerLabel` (case-insensitive)
- Columnas tabla: `number`, `customer`, `vehicle`, `total`, `state`, `payment_type`, `started_date`, `actions`
- Chips de estado coloreados con `[attr.data-state]` y CSS por atributo
- Acciones por fila: `onEdit` (navega a `/dashboard/ordenes/editar/:id`), `onPayments` (abre `ServiceOrderPaymentsModal`), `onPrint` (abre `ServiceOrderPrintModal`, **no** usa el patrón `floating-dialog-panel` — ver nota en §10), `onView` (abre `ServiceOrderDetailModal`)

---

## Componente: `ServiceOrderDetailModal`

- Recibe `ServiceOrder` via `MAT_DIALOG_DATA`
- En `ngOnInit` llama `getWithLines(order.id)` para cargar datos completos
- Muestra spinner (`MatProgressSpinnerModule`) mientras carga
- Estructura visual:
  1. Header: número · estado · tipo de pago · iva
  2. Cliente (nombre, CI, teléfono) · Vehículo (marca modelo placa)
  3. Mecánico responsable · Kilometraje
  4. Fechas (ingreso, salida, retorno, registrado) · **Registrado por** (`userLabel()`, ver §7)
  5. Descripción/diagnóstico
  6. Tabla mano de obra (si hay) — cada línea muestra un badge morado con el número de cotización de origen si `line.quote_id` no es nulo (`quoteTag()`)
  7. Tabla repuestos (si hay) — mismo badge de cotización
  8. Tabla trabajos adicionales (si hay) — mismo badge de cotización
  9. Resumen financiero: total → IVA → total+IVA → pagado → saldo
  10. ID de orden (monospace)
- Botón **"Agregar Cotización"** — visible solo si `detail()?.state === 'IN_PROGRESS'`, abre `AddQuoteToOrderModal` (ver [[quotes-service-orders]] §6) y recarga el detalle (`loadDetail()`) si se confirmó
- Botón Imprimir: `window.print()` · oculto con `@media print { .no-print { display: none } }` (imprime el propio modal de detalle, distinto del `ServiceOrderPrintModal` de §9/§10)
- `initialSize="lg"` (64rem) en `DialogFrame`

---

## Patrón de apertura de modales

**TODOS los modales que usan `DialogFrame`** (la mayoría: detalle, formularios rápidos, `AddQuoteToOrderModal`, pagos) **deben abrirse con:**

```typescript
this.dialog.open(SomeModal, {
  hasBackdrop: false,
  panelClass: 'floating-dialog-panel',
  data: { ... },
});
```

**Por qué:** `floating-dialog-panel` en `styles.scss` hace la surface de Material transparente y cede todo el control visual al `DialogFrame`. Sin `hasBackdrop: false` aparece el overlay oscuro y el drag no funciona correctamente.

**Nunca usar** `width` explícito para estos modales — el `DialogFrame` gestiona su propio tamaño con `dialogRef.updateSize(SIZE_MAP[size])` según `initialSize`.

**Excepciones deliberadas** (no usan `DialogFrame`, tienen su propio layout de impresión/confirmación):
- `ServiceOrderPrintModal` — se abre con `width: '840px'` (ancho A4 + margen), `maxWidth: '95vw'`, `maxHeight: '95vh'`, `autoFocus: false`, `panelClass: 'service-order-print-panel'`. No sigas el patrón `floating-dialog-panel` aquí — el layout de impresión necesita su propio ancho fijo.
- `ServiceOrderPaymentDeleteConfirmModal` — se abre con `width: '28rem'`, `maxWidth: '95vw'` (confirmación simple, no necesita `DialogFrame`).

---

## Reglas de negocio críticas

1. **Cliente obligatorio:** No se puede guardar sin `customer_id`. Validación en `onSave()`.
2. **Vehículo opcional:** `vehicle_id` puede ser null.
3. **Mecánico único por orden:** `mechanic_id` está en `service_orders`, NO en `service_order_services`.
4. **IVA constante:** `IVA_RATE = 0.13` definida como constante en `service-order-form.ts` (y repetida igual en `quote-form.ts` y `service-order-print-modal.ts` — si cambia la tasa, actualiza los 3).
5. **Descuento en mano de obra y repuestos:** Se guarda como porcentaje (0-100), NO como valor absoluto.
6. **Sin descuento en servicios externos:** El subtotal es siempre `price × quantity`.
7. **Guardado en dos fases:** Primero `service_orders` (insert u update) → obtener/reusar `id` → luego sincronizar las 3 tablas pivote (en edición: revertir egresos externos → borrar líneas viejas → reinsertar) → luego convertir cotizaciones seleccionadas.
8. **`must`/`have` al crear:** `must = totalWithIva()` y `have = 0`. Los pagos posteriores los gestionan las RPCs de §9, no este formulario.
9. **Realtime en dashboard:** `listen()` mantiene la lista actualizada sin refresh manual.
10. **Ids temporales:** Las filas en memoria usan `crypto.randomUUID()` como id local. El id definitivo lo asigna Supabase al hacer bulk insert.
11. **`quote_id` debe sobrevivir a una edición:** ver §5 de este documento y [[quotes-service-orders]] §5 — es la regla más fácil de romper sin darte cuenta si tocas `toXRow`/`saveLines`/los modelos.
12. **Nunca `forkJoin` sobre pasos dependientes:** conversión de cotizaciones (`concatMap`), reversión de egresos → borrado de líneas → reinserción (secuencial, con callbacks anidados, no en paralelo).

---

## Consideraciones al modificar el módulo

- Si agregas un campo a `ServiceOrder`, actualiza:
  1. `src/app/core/models/service-order.model.ts`
  2. `src/app/core/services/supabase/sb-service-order.ts` (selects de `get`/`getById`/`getWithLines`, payload de `add`/`update`)
  3. `service-order-form.ts` → `summaryForm` o tab correspondiente, y el `payload` de `onSave()`
  4. `service-order-form.html` → campo en el panel o tab
  5. `service-order-detail-modal.html` / `service-order-print-modal.html` → sección de detalle/impresión si aplica
  6. `src/docs/database/migrate.sql` → nueva migración versionada
  7. `src/docs/database/tables.sql` → actualizar definición de tabla

- Si agregas un campo a las tablas pivote, actualiza:
  1. El modelo correspondiente (`ServiceOrderService`, `ServiceOrderBatch`, etc.) **y** su interfaz `OrderXLine` (para el detalle)
  2. La interfaz `Row` extendida
  3. El tab correspondiente (form + emit, con el valor por defecto correcto — ej. `quote_id: null` si es un campo de trazabilidad)
  4. La tabla editable correspondiente (columnas + método de cambio)
  5. `service-order-form.ts` → `toXRow()` (carga en edición) **y** `saveLines()` (payload de reinserción) — los dos, o se pierde al editar
  6. `getWithLines()` en `sb-service-order.ts` si el campo debe aparecer en el detalle (join si es una FK)
  7. `service-order-detail-modal.html` → tabla de detalle

- Si modificas `CustomerTabValue` (tab-customer), verifica que `service-order-form.ts` consume correctamente todos sus campos en el payload de `onSave()`. Recuerda que este tab **no** conoce cotizaciones — si el campo tiene algo que ver con `quote_id`/`selectedQuotes`, va en `tab-quote` o en el propio `service-order-form.ts`, no aquí.

- Los botones de registro rápido (`add_circle`) en los tabs usan `floating-dialog-panel`. Si agregas uno nuevo, sigue el mismo patrón.

- Si tocas el flujo de guardado (`onSave`/`executeCreate`/`executeUpdate`/`saveLines`), respeta el orden de la cascada en edición: **revertir egresos externos → borrar líneas → reinsertar líneas → aplicar egresos externos nuevos → convertir cotizaciones seleccionadas**. Invertir cualquier paso puede dejar un egreso huérfano (sin línea asociada) o perder la trazabilidad de cotización.

---

## 7. `user_id` — quién registró la orden

- Al **crear**, `user_id = auth.currentUser()?.id` (usuario de la sesión activa vía `AuthService`).
- Al **editar**, `user_id` se preserva del valor original (`originalUserId` signal, cargado en
  `ngOnInit()` desde `getWithLines()`) — **editar una orden nunca cambia quién la registró**,
  aunque la edite otro usuario.
- Se muestra en `ServiceOrderDetailModal` como "Registrado por" (`userLabel()`, cae a
  "Sistema" si `user` es null) y en `ServiceOrderWithLines.user` (join `users(id,name,lastname)`
  en `getWithLines()`).

---

## 8. Modo edición — invariantes específicos

- El mismo componente `ServiceOrderForm` sirve para crear y editar; la única diferencia de
  entrada es la presencia de `:id` en la ruta.
- En edición, `customerTabValue` se recarga completo desde la orden existente (customer,
  vehicle, mechanic, mileage, fechas) pero **`selectedQuotes` arranca vacío** — no hay forma
  de reconstruir "qué cotizaciones originaron esta orden" desde las líneas existentes sin una
  consulta adicional, así que el tab Cotizaciones en modo edición solo sirve para **agregar
  cotizaciones nuevas** a una orden que ya existe (equivalente a lo que hace
  `AddQuoteToOrderModal` desde el detalle, pero integrado al flujo de edición).
- Las líneas existentes (`order_services`/`order_batches`/`order_externals`) se cargan con
  `toServiceRow`/`toBatchRow`/`toExternalRow`, que **sí** preservan `quote_id` — así que
  guardar una edición sin tocar esas líneas no destruye su trazabilidad (ver §5/§11).

---

## 9. Pagos y egresos asociados a una orden

Dos flujos financieros independientes, ambos vía RPC de Postgres (nunca REST encadenado desde
el cliente, para atomicidad — mismo criterio que las RPCs de cotizaciones):

### Pagos del cliente (`ServiceOrderPaymentsModal`)

- **Servicio:** `SPServiceOrderPayment` (`sb-service-order-payment.ts`).
- **RPCs:** `register_service_order_payment`, `edit_service_order_payment`,
  `delete_service_order_payment` (ver `migrate.sql` v19) — cada una toca
  `bank_account_histories` + `bank_accounts.balance` + `service_orders.have`/`must` en una
  sola transacción.
- **Tipo de transacción:** busca `bank_transaction_types` con `name = 'Pago de orden de
  servicio'` y `type = 'INCOME'` — si no existe, lanza error explícito pidiendo verificarlo en
  el catálogo.
- **UI:** `ServiceOrderPaymentsModal` (lista pagos vía
  `SPBankAccountHistory.getByReference(orderId, typeId)`, botones Registrar/Editar/Eliminar) →
  `ServiceOrderPaymentFormModal` (formulario con validación `max = must() [+ monto original si
  edita]`) → `ServiceOrderPaymentDeleteConfirmModal` (confirmación).
- Tras cualquier operación, el modal de pagos refresca tanto la lista de pagos como la orden
  (`refreshOrder()`) para reflejar el nuevo `have`/`must`.

### Egresos de servicios externos (`bank_account_id` en `service_order_external_services`)

- **Servicio:** `SPServiceOrderExternalExpense` (`sb-service-order-external-expense.ts`).
- **RPCs:** `apply_external_service_expense` (inserta el egreso y descuenta el saldo de la
  cuenta, se llama una vez por línea con `bank_account_id`) y
  `reverse_external_service_expenses_for_order` (revierte TODOS los egresos de una orden,
  buscando por `transaction_reference` entre los ids de sus líneas **actuales** — por eso debe
  llamarse ANTES de `deleteLinesByOrderId`, mientras esas líneas todavía existen).
- A diferencia de la compra de lotes (`sb-batch-purchase.ts`, que reconcilia in-place porque un
  lote es una entidad estable), las líneas de orden se sincronizan con **delete-all +
  re-insert** (ver `service-order-form.ts`), así que aquí no se reconcilia por línea: se
  revierte TODO antes de recrear las líneas, y se vuelve a aplicar TODO después
  (`applyExternalExpenses()` en `saveLines()`).
- Diseño original: `.claude/commands/service-order-external-expense.md`.

Si agregas un tercer flujo financiero ligado a una orden, sigue el mismo patrón: RPC
`SECURITY DEFINER` con `FOR UPDATE`, revert-then-reapply si convive con el delete-all +
re-insert de líneas, nunca cálculo de balances en el cliente.

---

## 10. Impresión (`ServiceOrderPrintModal`)

- Genera la "Hoja de Servicios" imprimible de una orden — distinto del botón Imprimir dentro
  de `ServiceOrderDetailModal` (ese imprime el propio modal de detalle; este es un layout
  dedicado tipo documento).
- Carga `getWithLines(order.id)` en `ngOnInit()`; calcula subtotales de mano de obra vs.
  repuestos+externos por separado (`subtotalServices`, `subtotalParts`) para el layout impreso.
- `IVA_RATE = 0.13` repetido aquí (ver regla de negocio #4 — si cambia, actualizar los 3
  lugares).
- Se abre con dimensiones fijas tipo A4, no con el patrón `floating-dialog-panel` (ver
  excepción en la sección de apertura de modales).
- Diseño original: `.claude/commands/service-order-print.md` y
  `.claude/commands/service-order-print-adjust.md` (ajustes posteriores: una sola copia, modal
  de vista previa).
