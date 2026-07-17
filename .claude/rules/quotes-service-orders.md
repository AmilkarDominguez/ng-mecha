# Cotizaciones ↔ Órdenes de Servicio

Contexto de referencia para trabajar en el módulo de **Cotizaciones** (`quotes`) y su
integración con **Órdenes de Servicio** (`service_orders`). Generado a partir del estado
real del código en la rama `feat/quote` (no solo del diseño original).

Documentos relacionados (más detallados, pero pueden quedar desactualizados en detalles de UI):
- `.claude/commands/quote-module.md` — diseño original del módulo (fuente de las RPCs).
- `.claude/commands/service-order-requires-quote.md` — diseño **superado**, solo historial.
- `.claude/docs/entities.md` — esquema de entidades (Quote, ServiceOrder, etc).

---

## 1. Modelo de relación (lo más importante para no romper)

- **N cotizaciones → 1 orden.** No existe `service_orders.quote_id` de cabecera. Nunca lo
  agregues — fue el diseño original (`service-order-requires-quote.md`) y se descartó a
  propósito porque una orden puede nacer de varias cotizaciones y recibir más durante el
  servicio.
- La trazabilidad vive en dos lugares:
  - `quotes.converted_service_order_id` (nullable) — se llena cuando la cotización se
    convierte. Varias cotizaciones pueden apuntar a la misma orden.
  - `quote_id` (nullable) en las 3 tablas pivote de la orden: `service_order_services`,
    `service_order_batches`, `service_order_external_services`. Indica de qué cotización
    vino cada línea; `null` = línea agregada directo en la orden, sin cotización.
- Una cotización aprobada se "convierte" en una orden llamando la RPC
  `convert_quote_to_order(quote_id, service_order_id)` — la orden puede ser nueva o una ya
  `IN_PROGRESS`. Convertir una segunda cotización sobre una orden abierta es el flujo normal
  de "trabajo adicional durante el servicio".
- `batches.stock` **nunca** se descuenta por cotizaciones. El stock disponible se calcula en
  la vista `batch_available_stock` = `stock - reservas ACTIVE vigentes - líneas de órdenes IN_PROGRESS`.
  Úsala (vía `SPBatch.getAvailableStock()`) en cualquier UI que necesite mostrar/validar stock
  para una cotización o una orden.

## 2. Tablas y tipos

```
quotes                    (cabecera; customer_id NOT NULL, vehicle_id/user_id/
                            converted_service_order_id nullable, number, description,
                            total/iva/total_iva/with_iva, expiration_date, state)
quote_services             (service_id, discount, price, quantity, subtotal)
quote_batches               (batch_id NULLABLE + description libre para repuestos no
                            catalogados, delivery_time IMMEDIATE|ORDER, price/discount/subtotal)
quote_external_services    (external_service_id, cost, price, quantity, subtotal — sin
                            bank_account_id: en cotización no hay pago)
batch_reservations          (quote_batch_id, batch_id, quantity, reserved_until, state
                            ACTIVE|CONSUMED|RELEASED|EXPIRED — no tiene CRUD de usuario,
                            solo la tocan las RPCs)
```

`QuoteState`: `PENDING | APPROVED | REJECTED | EXPIRED | CONVERTED | CANCELED`.

Modelos TS en `src/app/core/models/quote.model.ts`:
`Quote`, `QuoteService/Batch/ExternalService` (payload plano), `*Row` (fila de formulario,
con nombre legible), `*Line` + `QuoteWithLines` (lectura con joins, usado por
`getWithLines()`). `DeliveryTime` se **reimporta** de `service-order.model.ts`, no se
duplica — si necesitas ese tipo en un archivo de cotizaciones, impórtalo de ahí.

Las 3 tablas pivote de `service_orders` tienen `quote_id UUID REFERENCES quotes(id) ON
DELETE SET NULL` (ver `tables.sql` ALTER cerca de `batch_reservations`, y `migrate.sql` v22).
Los modelos TS correspondientes (`ServiceOrderService/Batch/ExternalService` y
`OrderServiceLine/BatchLine/ExternalLine` en `service-order.model.ts`) **sí** tienen el campo
`quote_id` tipado — se agregó explícitamente porque faltaba y rompía la trazabilidad al
editar (ver §5).

## 3. RPCs (todo el ciclo de vida es SQL, nunca `forkJoin` desde Angular)

Definidas en `tables.sql` y `migrate.sql` (v22+), llamadas desde
`src/app/core/services/supabase/sb-quote-conversion.ts` (`SPQuoteConversion`):

| RPC | Cuándo | Qué hace |
|---|---|---|
| `reserve_quote_batches(p_quote_id)` | Aprobar `PENDING → APPROVED` | `FOR UPDATE` por lote en orden determinístico por `batch_id` (evita deadlocks). Reserva stock de líneas `IMMEDIATE` con `batch_id` no nulo contra `batch_available_stock`. Si algún lote no alcanza, **aborta todo** (sin reservas parciales). Exige `expiration_date` presente y `>= CURRENT_DATE`. |
| `release_quote_reservations(p_quote_id, p_target_state)` | Rechazar (`REJECTED`) o anular (`CANCELED`) | Libera (`RELEASED`) las reservas `ACTIVE` de la cotización y mueve su estado. También la usa `expire_overdue_quote_reservations()` internamente con `EXPIRED`. |
| `convert_quote_to_order(p_quote_id, p_service_order_id)` | Cotización `APPROVED` → orden (nueva o existente) | Copia las 3 líneas con `quote_id` seteado, marca reservas `ACTIVE → CONSUMED`, **recalcula `total/iva/total_iva/must` de la orden desde cero** (suma de TODAS sus líneas actuales, no un delta) y marca la cotización `CONVERTED` + `converted_service_order_id`. Por eso convertir una 2ª cotización sobre una orden abierta nunca desincroniza el total. |
| `expire_overdue_quote_reservations()` | Sin cron disponible — resolución perezosa | Recorre cotizaciones `APPROVED` con `expiration_date < CURRENT_DATE`, libera sus reservas y las pasa a `EXPIRED`. Se llama **best-effort** (swallow de error) desde `SPQuote.get()` cada vez que se lista — no bloquea el listado si falla. |

Todas usan `SECURITY DEFINER`, `FOR UPDATE` en las filas que tocan, y
`REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO anon, authenticated`. Si agregas una
RPC nueva para este módulo, sigue el mismo patrón (transacción única en Postgres, nunca
varias llamadas REST encadenadas desde el cliente).

## 4. Servicios Angular

- `SPQuote` (`sb-quote.ts`) — CRUD estándar (mismo patrón que `SPServiceOrder`): `get`
  (encadena `expireOverdue()` primero), `getById`, `add`, `update`, `delete`, `listen()`
  (canal realtime `quotes-changes`), `getWithLines(id)` (forkJoin quote+3 líneas con joins de
  nombre), `bulkAddServices/Batches/ExternalServices`, `deleteLinesByQuoteId` (solo se usa al
  editar una cotización `PENDING`; nunca se llama sobre una `APPROVED`/`CONVERTED`).
- `SPQuoteConversion` (`sb-quote-conversion.ts`) — wrapper delgado de las 4 RPCs de la tabla
  anterior. `approve()`, `reject()`, `cancel()`, `convertToOrder(quoteId, serviceOrderId)`.
  No contiene lógica de negocio propia; si necesitas cambiar el comportamiento, el cambio va
  en la función SQL, no aquí.

## 5. Regla crítica: `quote_id` debe sobrevivir a una edición de orden

`service-order-form.ts` guarda con el patrón **delete-all + re-insert-all** en
`executeUpdate()` (`deleteLinesByOrderId` → `saveLines()`). Si el payload de una línea no
incluye `quote_id`, la edición **borra silenciosamente el vínculo con la cotización de
origen** aunque el usuario no haya tocado esa línea.

Puntos que deben mantener `quote_id` sincronizado si tocas este flujo:
- `toServiceRow` / `toBatchRow` / `toExternalRow` (cargan una línea existente al formulario).
- `saveLines()` → `servicesToSave` / `batchesToSave` / `externalToSave` (payload de reinserción).
- `sb-service-order.ts` → `getWithLines()` debe seguir haciendo join `quote:quotes(number)`
  en las 3 tablas pivote (se usa para mostrar el número de cotización de origen).
- Las líneas agregadas manualmente (no desde una cotización) en `tab-labor` / `tab-parts` /
  `tab-external` deben emitir `quote_id: null` explícito (es un campo requerido en el tipo).

Si agregas un campo nuevo a las tablas pivote de orden que también exista en las tablas
pivote de cotización (ej. algo que se copie en `convert_quote_to_order`), aplica la misma
regla: agrégalo a los modelos TS y a los 3 puntos de arriba, o se perderá al editar.

## 6. UI — dónde vive cada pieza

### Feature `quote` (`src/app/features/quote/`)
- Rutas (`app.routes.ts`, bajo `AdminLayout`/`authGuard`):
  `/dashboard/cotizaciones/activas` (dashboard), `/nueva` y `/editar/:id` (formulario).
- `quote-dashboard` — tabla con 2 tabs: **Cotizaciones** (`PENDING|APPROVED|CONVERTED`) y
  **Anuladas** (`REJECTED|EXPIRED|CANCELED`). Acciones por fila (menú), no en el modal de
  detalle: `PENDING` → Aprobar/Rechazar; `APPROVED` → "Convertir a Orden de Servicio"
  (navega a `/dashboard/ordenes/nueva?quoteId=<id>`, **no** llama la RPC directo — la
  conversión ocurre dentro de `service-order-form.ts` al guardar); cualquiera de las dos →
  Anular. Editar solo si `PENDING`.
- `quote-form` — tabs cliente/mano de obra/repuestos/externos. Guarda siempre en `PENDING`
  (aprobar/rechazar/convertir viven en el dashboard, no aquí). `expiration_date` por defecto
  `hoy + 3 días`. `IVA_RATE = 0.13`, igual que en `service-order-form`.
- `tab-parts` (de cotización) usa `SPBatch.getAvailableStock()` para buscar/validar stock —
  nunca uses `batches.stock` a secas aquí. Soporta línea manual sin catálogo (`batch_id:
  null` + `description` libre, fuerza `delivery_time: 'ORDER'`).
- `quote-detail-modal` — solo lectura (Cerrar/Imprimir), sin botones de acción de estado.

### Integración en `service-order` (`src/app/features/service-order/`)

Dos entradas distintas para "agregar una cotización a una orden", ambas terminan llamando
`SPQuoteConversion.convertToOrder(quoteId, orderId)` y ambas muestran **primero un preview
de las líneas de la cotización antes de confirmar** (no se agrega nada a ciegas):

1. **Formulario de orden (`service-order-form`), crear o editar** — tab dedicado
   **"Cotizaciones"**:
   - `tab-quote` (`components/tab-quote/`) — autocomplete de cotizaciones `APPROVED`
     filtradas por `customerId`/`vehicleId` (inputs) y `excludeIds` (ya agregadas). Al elegir
     una, llama `SPQuote.getWithLines()` y muestra un preview (líneas + total) con botones
     Cancelar / "Agregar a la Orden". Solo al confirmar emite `addQuote` con el `Quote`
     completo.
   - `service-order-quotes-table` (`components/service-order-quotes-table/`) — lista las
     cotizaciones ya confirmadas para esta orden (número, vencimiento, total) con acción de
     quitar. Vive junto a las otras 3 tablas de líneas bajo `tables-section`.
   - Estado en `service-order-form.ts`: `selectedQuotes = signal<Quote[]>([])`,
     `selectedQuoteIds` computed. `onAddQuote`/`onRemoveQuote` mutan la lista. El total
     mostrado en el panel resumen (`subtotalQuotes`) es **solo informativo** — no se suma a
     `total()`/`payload.total` porque `convert_quote_to_order` recalcula el total real de la
     orden desde cero al procesar cada cotización (ver §3). No dupliques esa suma en el
     cliente.
   - `finalizeWithQuotes()` corre **después** de `saveLines()` (para que ya existan las
     líneas ad-hoc antes de que la RPC recalcule el total) y encadena las conversiones con
     `concatMap` (**nunca** `forkJoin`) — si una cotización falla, las anteriores ya
     convertidas quedan aplicadas y el error se atribuye a esa cotización puntual.
   - Flujo `?quoteId=` (deep link desde `quote-dashboard.onConvert()`): `ngOnInit` llama
     `SPQuote.getById(quoteId)` para precargar `customer_id`/`vehicle_id` en
     `customerTabValue` y precargar `selectedQuotes` con esa cotización — **no** lo resuelve
     `tab-customer` (ese tab ya no sabe nada de cotizaciones, ver nota abajo).
   - `tab-customer` (`components/tab-customer/`) quedó **solo** con
     customer/vehicle/mechanic/mileage/fechas. No tiene `quote_ids` ni lógica de cotizaciones
     — se movió entera a `tab-quote` + el `ngOnInit` de `service-order-form.ts`. Si ves código
     viejo o un skill que mencione un `mat-select` de cotizaciones dentro de `tab-customer`,
     está desactualizado.

2. **Vista de detalle (`ServiceOrderDetailModal`), orden ya `IN_PROGRESS`** — botón
   "Agregar Cotización" (visible solo si `state === 'IN_PROGRESS'`) abre
   `AddQuoteToOrderModal` (`components/add-quote-to-order-modal/`):
   - Filtra elegibles por `state === 'APPROVED' && customer_id === order.customer_id &&
     (!order.vehicle_id || quote.vehicle_id === order.vehicle_id)` — si la orden tiene
     vehículo, solo se ofrecen cotizaciones de ese mismo vehículo.
   - Igual que `tab-quote`: al elegir una cotización carga su preview
     (`getWithLines`) antes de habilitar el botón de confirmar. Confirmar llama
     `convertToOrder` y cierra devolviendo `true`; el modal padre hace `loadDetail()` de
     nuevo.
   - `ServiceOrderDetailModal` muestra, junto a cada línea (mano de obra / repuestos /
     externos), un badge morado con el número de cotización de origen cuando
     `line.quote_id` no es nulo (método `quoteTag()`). Si agregas un nuevo tipo de línea a la
     orden, replica ese patrón para no perder la trazabilidad visual.

### Menú y layout
- `nav-menu.ts` — un solo grupo "Cotizaciones" → `/dashboard/cotizaciones/activas` (la
  pestaña "Anuladas" vive dentro del dashboard, no como link de menú separado; mismo patrón
  simplificado que "Órdenes de Servicio").

## 7. Checklist rápido antes de tocar este módulo

1. ¿Estás agregando un campo a una línea de cotización que también existe en la línea de
   orden equivalente? → agrégalo también a `convert_quote_to_order` (SQL) y a los 3 puntos
   de §5 (modelos TS + `toXRow` + `saveLines`), o se pierde en cascada.
2. ¿Vas a mostrar o validar stock disponible? → usa `batch_available_stock` /
   `SPBatch.getAvailableStock()`, nunca `batches.stock` directo.
3. ¿Vas a encadenar más de una operación de cotización (aprobar+convertir, convertir varias,
   etc.)? → hazlo con RPC en Postgres o `concatMap` secuencial en el cliente, nunca
   `forkJoin` sobre pasos que dependen unos de otros.
4. ¿Vas a agregar otro punto de entrada para "convertir cotización a orden"? → sigue el
   patrón ya establecido: elegir cotización `APPROVED` elegible → **preview de líneas antes
   de confirmar** → `SPQuoteConversion.convertToOrder()` → refrescar la vista. No agregues un
   tercer flujo sin preview.
5. ¿Vas a agregar `service_orders.quote_id` de cabecera? → no. Ya se decidió que no (ver §1);
   si el requerimiento parece pedirlo, probablemente lo que falta es un `quote_id` a nivel de
   línea en alguna tabla nueva, no en la cabecera.
