Skill de referencia del módulo de Órdenes de Servicio — estado actual del código.

Utiliza un razonamiento: adaptive thinking

**Instrucción:** Lee este documento completamente antes de tocar cualquier archivo del módulo `service-order`. Captura el estado real implementado, las reglas de negocio activas, las dependencias entre componentes y los invariantes que NO deben romperse al modificar el módulo.

---

# Módulo: Órdenes de Servicio (`service-order`)

## Rutas

| URL | Componente |
|-----|-----------|
| `/dashboard/ordenes/en-curso` | `ServiceOrderDashboard` |
| `/dashboard/ordenes/nueva` | `ServiceOrderForm` |

Ambas bajo `AdminLayout` con lazy loading en `src/app/app.routes.ts`.

---

## Estructura de archivos

```
src/app/features/service-order/
├── service-order-form/                    ← Formulario de creación
│   ├── service-order-form.ts
│   ├── service-order-form.html
│   └── service-order-form.scss
├── service-order-dashboard/               ← Listado + búsqueda + detalle
│   ├── service-order-dashboard.ts
│   ├── service-order-dashboard.html
│   └── service-order-dashboard.scss
└── components/
    ├── tab-customer/                      ← Tab 1: cliente, vehículo, mecánico
    ├── tab-labor/                         ← Tab 2: mano de obra (servicios)
    ├── tab-parts/                         ← Tab 3: repuestos e insumos (lotes)
    ├── tab-external/                      ← Tab 4: trabajos adicionales
    ├── service-order-services-table/      ← Tabla editable inline de mano de obra
    ├── service-order-batches-table/       ← Tabla editable inline de repuestos
    ├── service-order-external-services-table/ ← Tabla editable inline de externos
    └── service-order-detail-modal/        ← Modal de detalle de orden (readonly)
```

---

## Base de datos

### `service_orders` (tabla principal)

| Columna               | Tipo                   | Notas |
|-----------------------|------------------------|-------|
| id                    | UUID PK                | auto |
| customer_id           | UUID FK → customers    | NOT NULL |
| vehicle_id            | UUID FK → vehicles     | nullable, ON DELETE SET NULL |
| mechanic_id           | UUID FK → mechanics    | nullable, ON DELETE SET NULL |
| user_id               | UUID FK → users        | nullable, ON DELETE SET NULL |
| number                | TEXT                   | nullable — código identificador |
| description           | TEXT                   | nullable — recomendaciones/diagnóstico |
| total                 | NUMERIC(10,2)          | suma de subtotales |
| have                  | NUMERIC(10,2)          | pagado (default 0) |
| must                  | NUMERIC(10,2)          | total_iva o total — saldo |
| iva                   | NUMERIC(10,2)          | nullable — 13% si aplica |
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

### `service_order_services` (mano de obra)

| Columna          | Tipo            | Notas |
|------------------|-----------------|-------|
| id               | UUID PK         | auto |
| service_id       | UUID FK → services | nullable, ON DELETE SET NULL |
| service_order_id | UUID FK → service_orders | ON DELETE CASCADE |
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
| bank_account_id     | UUID FK → bank_accounts | nullable, ON DELETE SET NULL |
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
  customer?: Customer;             // join disponible en get()/getWithLines()
  vehicle?: Vehicle;               // join disponible en get()/getWithLines()
}

// Interfaces pivot
interface ServiceOrderService    { id, service_id, service_order_id, discount, price, quantity, subtotal, ... }
interface ServiceOrderBatch      { id, batch_id, service_order_id, quantity, delivery_time, price, discount, subtotal, ... }
interface ServiceOrderExternalService { id, external_service_id, service_order_id, bank_account_id, cost, price, quantity, subtotal, ... }

// Rows usadas en memoria durante formulario (incluyen nombre para mostrar)
interface ServiceOrderServiceRow  extends ServiceOrderService  { service_name: string }
interface ServiceOrderBatchRow    extends ServiceOrderBatch    { product_name: string; industry_name: string }
interface ServiceOrderExternalServiceRow extends ServiceOrderExternalService { external_service_name: string }

// Interfaces para vista de detalle (con joins anidados)
interface OrderServiceLine  { id, service_id, price, quantity, discount, subtotal, service: {name, code} | null }
interface OrderBatchLine    { id, batch_id, price, quantity, discount, subtotal, delivery_time, batch: {description, product: {name} | null} | null }
interface OrderExternalLine { id, external_service_id, bank_account_id, cost, price, quantity, subtotal, external_service: {name, company_name} | null }

interface ServiceOrderWithLines extends ServiceOrder {
  mechanic: { id: string; name: string | null; lastname: string | null } | null;
  order_services: OrderServiceLine[];
  order_batches: OrderBatchLine[];
  order_externals: OrderExternalLine[];
}
```

---

## Servicio Supabase

**Archivo:** `src/app/core/services/supabase/sb-service-order.ts`
**Clase:** `SPServiceOrder` — `providedIn: 'root'`

### Métodos sobre `service_orders`

| Método | Devuelve | Descripción |
|--------|----------|-------------|
| `get()` | `Observable<ServiceOrder[]>` | Todas las órdenes con join a customers y vehicles. Order: `created_at DESC` |
| `getById(id)` | `Observable<ServiceOrder>` | Una orden por ID con join a customers y vehicles |
| `getWithLines(id)` | `Observable<ServiceOrderWithLines>` | `forkJoin`: orden + join mechanic + 3 tablas pivot con sus joins. Usado por el modal de detalle |
| `add(item)` | `Observable<ServiceOrder>` | Inserta la orden y retorna el registro completo (incluye id generado) |
| `update(item)` | `Observable<ServiceOrder>` | Actualiza orden por id |
| `delete(id)` | `Observable<void>` | Elimina orden |
| `listen()` | `Observable<ServiceOrder[]>` | BehaviorSubject + canal realtime de Supabase. Actualiza automáticamente al cambiar la tabla |

### Métodos sobre tablas pivot

| Método | Descripción |
|--------|-------------|
| `bulkAddServices(items[])` | Inserta varias filas en `service_order_services` de una vez |
| `bulkAddBatches(items[])` | Inserta varias filas en `service_order_batches` |
| `bulkAddExternalServices(items[])` | Inserta varias filas en `service_order_external_services` |
| `addService/addBatch/addExternalService` | Inserta una sola fila (menos usados) |
| `deleteService/deleteBatch/deleteExternalService` | Elimina por id |

---

## Componente: `ServiceOrderForm`

**Ubicación:** `service-order-form/service-order-form.ts`

### Estado (signals)

```typescript
customerTabValue = signal<CustomerTabValue | null>(null)
serviceRows      = signal<ServiceOrderServiceRow[]>([])
batchRows        = signal<ServiceOrderBatchRow[]>([])
externalRows     = signal<ServiceOrderExternalServiceRow[]>([])
```

### Cálculos (computed)

```typescript
subtotalServices = computed(() => serviceRows().reduce( (precio × qty) - (precio × qty × desc/100), 0 ))
subtotalBatches  = computed(() => batchRows().reduce( igual fórmula, 0 ))
subtotalExternal = computed(() => externalRows().reduce( precio × qty, 0 ))  // sin descuento
total            = computed(() => subtotalServices() + subtotalBatches() + subtotalExternal())
ivaAmount        = computed(() => with_iva ? total() × 0.13 : 0)
totalWithIva     = computed(() => total() + ivaAmount())
```

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

### Flujo de guardado `onSave()`

1. Valida: `customerTabValue()?.customer_id` debe existir → snackbar de error y abort
2. Construye payload de `service_orders` con todos los campos del form + datos del tab cliente
3. Llama `serviceOrderProvider.add(payload)` → obtiene `order.id`
4. Con el `order.id`, en paralelo (forkJoin implícito con counter):
   - Si `serviceRows.length > 0` → `bulkAddServices([...])`
   - Si `batchRows.length > 0` → `bulkAddBatches([...])`
   - Si `externalRows.length > 0` → `bulkAddExternalServices([...])`
5. Cuando todos los pendientes llegan a 0 → snackbar "Orden registrada" + navega a `/dashboard/ordenes/en-curso`

**Campo `must` en el payload:** siempre = `totalWithIva()` (el saldo comienza igual al total)
**Campo `have`:** siempre = `0` al crear

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

> ⚠️ `number` fue movido al `summaryForm` del formulario principal. NO está en `CustomerTabValue`.

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
- `onAdd()` genera `crypto.randomUUID()` como id temporal de fila, descuento default = 0
- `openNewServiceDialog()` — crea servicio rápido con `ServiceFormModal`

> ⚠️ **El mecánico NO se selecciona aquí.** El selector de mecánico está en Tab 1 (`tab-customer`).

---

## Componente: `TabParts`

**Selector:** `app-tab-parts`
**Output:** `addItem: output<ServiceOrderBatchRow>()`

- Búsqueda por texto libre (mín. 2 caracteres), retorna máx. 8 resultados
- Busca en: `product.name`, `description`, `code`, `compatible_brands`, `compatible_models`
- Solo lotes con `state === 'ACTIVE'`
- `openNewBatchDialog()` — crea lote rápido con `BatchFormModal`. Requiere inyectar `SPProduct`, `SPWarehouse`, `SPSupplier`, `SPIndustry`, `SPBrand` en el tab para pasar como data al modal
- `delivery_time` default: `IMMEDIATE`

---

## Componente: `TabExternal`

**Selector:** `app-tab-external`
**Output:** `addItem: output<ServiceOrderExternalServiceRow>()`

- Filtra servicios externos `ACTIVE`
- Al seleccionar: habilita campos de costo/precio/cantidad/bank_account
- `bank_account_id` es opcional (nullable)
- Subtotal = `price × quantity` (sin descuento)
- `openNewExternalServiceDialog()` — crea servicio externo rápido con `ExternalServiceFormModal`

---

## Tablas editables inline

Todas comparten el mismo patrón:

| Componente | Input | Output | Descripción editable |
|---|---|---|---|
| `ServiceOrderServicesTable` | `items: ServiceOrderServiceRow[]` | `removeItem: string` | precio, cantidad, descuento% |
| `ServiceOrderBatchesTable` | `items: ServiceOrderBatchRow[]` | `removeItem: string` | precio, cantidad, descuento%, delivery_time |
| `ServiceOrderExternalServicesTable` | `items: ServiceOrderExternalServiceRow[]` | `removeItem: string` | costo, precio, cantidad |

- Los cambios son **directos sobre el objeto** de la fila (mutación local del array reactivo)
- El computed `subtotalX()` en el formulario principal recalcula en cada cambio
- El descuento se limita a 0-100 con `Math.min(100, Math.max(0, d))`
- La eliminación dispara snackbar de confirmación

---

## Componente: `ServiceOrderDashboard`

- Usa `listen()` para actualización en tiempo real
- Búsqueda filtra por `number` y `customerLabel` (case-insensitive)
- Columnas tabla: `number`, `customer`, `vehicle`, `total`, `state`, `payment_type`, `started_date`, `actions`
- Chips de estado coloreados con `[attr.data-state]` y CSS por atributo
- `onView(order)` abre `ServiceOrderDetailModal` con `{ hasBackdrop: false, panelClass: 'floating-dialog-panel', data: order }`

---

## Componente: `ServiceOrderDetailModal`

- Recibe `ServiceOrder` via `MAT_DIALOG_DATA`
- En `ngOnInit` llama `getWithLines(order.id)` para cargar datos completos
- Muestra spinner (`MatProgressSpinnerModule`) mientras carga
- Estructura visual:
  1. Header: número · estado · tipo de pago · iva
  2. Cliente (nombre, CI, teléfono) · Vehículo (marca modelo placa)
  3. Mecánico responsable · Kilometraje
  4. Fechas (ingreso, salida, retorno, registrado)
  5. Descripción/diagnóstico
  6. Tabla mano de obra (si hay)
  7. Tabla repuestos (si hay)
  8. Tabla trabajos adicionales (si hay)
  9. Resumen financiero: total → IVA → total+IVA → pagado → saldo
  10. ID de orden (monospace)
- Botón Imprimir: `window.print()` · oculto con `@media print { .no-print { display: none } }`
- `initialSize="lg"` (64rem) en `DialogFrame`

---

## Patrón de apertura de modales

**TODOS los modales que usan `DialogFrame` deben abrirse con:**

```typescript
this.dialog.open(SomeModal, {
  hasBackdrop: false,
  panelClass: 'floating-dialog-panel',
  data: { ... },
});
```

**Por qué:** `floating-dialog-panel` en `styles.scss` hace la surface de Material transparente y cede todo el control visual al `DialogFrame`. Sin `hasBackdrop: false` aparece el overlay oscuro y el drag no funciona correctamente.

**Nunca usar** `width` explícito para estos modales — el `DialogFrame` gestiona su propio tamaño con `dialogRef.updateSize(SIZE_MAP[size])` según `initialSize`.

---

## Reglas de negocio críticas

1. **Cliente obligatorio:** No se puede guardar sin `customer_id`. Validación en `onSave()`.
2. **Vehículo opcional:** `vehicle_id` puede ser null.
3. **Mecánico único por orden:** `mechanic_id` está en `service_orders`, NO en `service_order_services`.
4. **IVA constante:** `IVA_RATE = 0.13` definida como constante en `service-order-form.ts`.
5. **Descuento en mano de obra y repuestos:** Se guarda como porcentaje (0-100), NO como valor absoluto.
6. **Sin descuento en servicios externos:** El subtotal es siempre `price × quantity`.
7. **Guardado en dos fases:** Primero `service_orders` → obtener `id` → luego las 3 tablas pivot con ese `id`.
8. **`must` = deuda inicial:** Al crear, `must = totalWithIva()` y `have = 0`.
9. **Realtime en dashboard:** `listen()` mantiene la lista actualizada sin refresh manual.
10. **Ids temporales:** Las filas en memoria usan `crypto.randomUUID()` como id local. El id definitivo lo asigna Supabase al hacer bulk insert.

---

## Consideraciones al modificar el módulo

- Si agregas un campo a `ServiceOrder`, actualiza:
  1. `src/app/core/models/service-order.model.ts`
  2. `src/app/core/services/supabase/sb-service-order.ts` (add/update payload)
  3. `service-order-form.ts` → `summaryForm` o tab correspondiente
  4. `service-order-form.html` → campo en el panel o tab
  5. `service-order-detail-modal.html` → sección de detalle
  6. `src/docs/database/migrate.sql` → nueva migración versionada
  7. `src/docs/database/tables.sql` → actualizar definición de tabla

- Si agregas un campo a las tablas pivot, actualiza:
  1. El modelo correspondiente (`ServiceOrderService`, `ServiceOrderBatch`, etc.)
  2. La interfaz `Row` extendida
  3. El tab correspondiente (form + emit)
  4. La tabla editable correspondiente (columnas + método de cambio)
  5. `service-order-form.ts` → mapping en bulk save
  6. `getWithLines()` en el servicio si el campo debe aparecer en el detalle
  7. Las interfaces `OrderServiceLine` / `OrderBatchLine` / `OrderExternalLine`
  8. `service-order-detail-modal.html` → tabla de detalle

- Si modificas `CustomerTabValue` (tab-customer), verifica que `service-order-form.ts` consume correctamente todos sus campos en el payload de `onSave()`.

- Los botones de registro rápido (`add_circle`) en los tabs usan `floating-dialog-panel`. Si agregas uno nuevo, sigue el mismo patrón.
