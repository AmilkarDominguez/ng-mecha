Implementa el módulo de Cotizaciones: entidades propias, reserva de stock con vencimiento (sin descontar `batches.stock`), y líneas convertibles a Orden de Servicio — una orden puede nacer de varias cotizaciones, y una orden `IN_PROGRESS` puede recibir cotizaciones adicionales.

Utiliza un razonamiento: adaptive thinking

**Instrucción:** Lee este documento completo antes de tocar cualquier archivo. Antes de implementar, lee también:
> - `.claude/docs/entities.md` — sección "Quotes Module" (ya actualizada) y sección "Service Orders Module" (columnas `quote_id` ya agregadas a las 3 tablas pivote)
> - `.claude/docs/features.md` — módulo "Cotizaciones" ya está en el menú planificado (`Cotizaciones/Cotizaciones`, `Cotizaciones/Anuladas`)
> - `.claude/docs/service-order-flow.md` — estado real del módulo de Órdenes de Servicio: estructura de tabs, patrón de guardado en 2 fases, modales `DialogFrame`
> - `.claude/commands/create-crud.md` — patrón base de CRUD (dashboard/tabla/modal) a seguir para las pantallas simples
> - `.claude/commands/service-order-requires-quote.md` — **su diseño original (1 quote_id NOT NULL en `service_orders`) queda superado por este documento.** No lo implementes; ya tiene una nota al respecto.

---

## 1. Contexto de negocio

Escenario real del taller:
1. El cliente pide una cotización. Se arma con mano de obra, repuestos (de inventario o por pedir) y servicios externos.
2. El cliente aprueba la cotización → se reserva el stock de los repuestos que sí están en inventario, por un tiempo limitado (`expiration_date`).
3. El cliente confirma → se genera (o se completa) la Orden de Servicio a partir de esa cotización.
4. Durante el servicio surge un problema imprevisto (ej. una pieza adicional dañada) → se crea una **segunda cotización** para el trabajo extra, se aprueba, y se **agrega a la orden ya `IN_PROGRESS`** — no se crea una orden nueva.

Esto implica una relación **N cotizaciones → 1 orden**, y que una orden puede recibir cotizaciones en momentos distintos de su ciclo de vida (no solo al crearse). Un `service_orders.quote_id` de cabecera (1:1) no puede representar esto.

## 2. Decisión de arquitectura: entidades separadas (SÍ, justificado)

**Cotización ≠ Orden de Servicio**, aunque compartan la misma forma de línea (servicio / repuesto / servicio externo):

| | Cotización | Orden de Servicio |
|---|---|---|
| Ciclo de vida | Pendiente → Aprobada/Rechazada → Convertida/Expirada/Anulada | En curso → Completada/Cancelada |
| Efecto en stock | Reserva blanda con vencimiento (no descuenta) | Compromiso firme sin vencimiento (tampoco descuenta `batches.stock` hoy — ver §5) |
| Efecto contable | Ninguno (es un estimado) | Genera cobros reales (`have`/`must`, pagos vía `register_service_order_payment`) |
| Repuestos no catalogados | Permitido (`batch_id` nulo + descripción libre, "por pedir") | No aplica — al convertir, ya se resolvió a un repuesto real o queda como pedido pendiente |
| Cardinalidad hacia el otro lado | Una cotización aprobada se convierte en **una** orden (`converted_service_order_id`) | Una orden puede recibir líneas de **varias** cotizaciones, incluso después de creada |

Reutilizar `service_orders` y sus tablas pivote para representar "una cotización en curso" obligaría a inventar estados falsos (¿qué es una orden `PENDING`/`APPROVED` sin mecánico ni fecha de ingreso?) y mezclaría el reporte de utilidades/pagos con filas que nunca debieron cobrar. Es el mismo criterio que ya separa `batches` (inventario real) de `service_order_batches` (líneas de una venta): la cotización es el "carrito", la orden es la "venta confirmada".

## 3. Modelo de datos (nuevo)

Ya documentado en `.claude/docs/entities.md` → sección **Quotes Module**. Resumen de tablas:

- **`quotes`** — cabecera. `customer_id` (not null), `vehicle_id` (nullable), `user_id`, `converted_service_order_id` (nullable, se llena al convertir), `number`, `description`, `total`/`iva`/`total_iva`/`with_iva` (mismo criterio que `service_orders`), `expiration_date` (vencimiento de la reserva), `state` (`quote_state_enum`: `PENDING`/`APPROVED`/`REJECTED`/`EXPIRED`/`CONVERTED`/`CANCELED`).
- **`quote_services`** — espejo de `service_order_services` (service_id, discount, price, quantity, subtotal).
- **`quote_batches`** — espejo de `service_order_batches`, con `batch_id` **nullable** + `description` (para repuestos no catalogados) y reutiliza `delivery_time_enum` (`IMMEDIATE`/`ORDER`).
- **`quote_external_services`** — espejo de `service_order_external_services` (sin `bank_account_id`: en cotización no hay pago).
- **`batch_reservations`** — la reserva de stock. `quote_batch_id` (not null), `batch_id` (not null), `quantity`, `reserved_until`, `state` (`reservation_state_enum`: `ACTIVE`/`CONSUMED`/`RELEASED`/`EXPIRED`). Tabla de sistema, no tiene CRUD de usuario — solo la tocan las RPCs del §4.
- **`quote_id` nullable** agregado a `service_order_services`, `service_order_batches`, `service_order_external_services` — trazabilidad de qué cotización originó cada línea (null si se agregó directo en la orden, ej. con `/service-order-quick-register`).

**No se agrega ninguna columna `quote_id` en la cabecera `service_orders`.**

## 4. Reglas de negocio y RPCs (cascada multi-tabla → RPC, NO forkJoin — ver `[[project-patterns]]`)

Igual que pagos de orden / compra de lote / egreso de servicio externo, cada operación que toca varias tablas debe ser una función `plpgsql SECURITY DEFINER` con `FOR UPDATE`, invocada vía `supabase.rpc(...)`. Ninguna de estas 3 operaciones se resuelve con updates sueltos desde Angular.

### 4.1 `reserve_quote_batches(p_quote_id UUID)` — al aprobar una cotización

1. `SELECT quotes FOR UPDATE`; debe estar en `PENDING`, si no → excepción.
2. `expiration_date` debe existir y ser `>= CURRENT_DATE` (la UI debe exigir este campo antes de habilitar "Aprobar").
3. Para cada fila de `quote_batches` de esa cotización con `delivery_time = 'IMMEDIATE' AND batch_id IS NOT NULL` (ordenadas por `batch_id` para lock determinista, evita deadlocks):
   - `SELECT batches FOR UPDATE`.
   - Calcula `available_stock` (fórmula del §5) con lock ya tomado.
   - Si `quantity > available_stock` → `RAISE EXCEPTION` indicando qué repuesto no tiene stock suficiente (aborta toda la aprobación, ninguna reserva parcial).
   - `INSERT INTO batch_reservations (quote_batch_id, batch_id, quantity, reserved_until, state) VALUES (..., quotes.expiration_date, 'ACTIVE')`.
4. `UPDATE quotes SET state = 'APPROVED' WHERE id = p_quote_id`.

### 4.2 `release_quote_reservations(p_quote_id UUID, p_target_state TEXT)` — rechazar / anular / expirar

1. `SELECT quotes FOR UPDATE`.
2. `UPDATE batch_reservations SET state = 'RELEASED' WHERE quote_batch_id IN (SELECT id FROM quote_batches WHERE quote_id = p_quote_id) AND state = 'ACTIVE'`. (Cuando se llama por expiración usar `state = 'EXPIRED'` en vez de `'RELEASED'`, ver §4.4.)
3. `UPDATE quotes SET state = p_target_state::quote_state_enum WHERE id = p_quote_id`.

Se usa para `REJECTED` y `CANCELED`. Una cotización `PENDING` (nunca aprobada, sin reservas) se puede rechazar/anular con un `UPDATE` directo sin RPC — solo pasa por esta RPC si tenía reservas activas que liberar.

### 4.3 `convert_quote_to_order(p_quote_id UUID, p_service_order_id UUID)` — el corazón del módulo

1. `SELECT quotes FOR UPDATE`; debe estar en `APPROVED` (no `CONVERTED` — una cotización se convierte una sola vez, completa).
2. `SELECT service_orders FOR UPDATE` (debe existir).
3. Copia **todas** las líneas de la cotización a las tablas pivote de la orden, con `quote_id = p_quote_id`:
   - `INSERT INTO service_order_services (service_order_id, quote_id, service_id, discount, price, quantity, subtotal) SELECT p_service_order_id, id, service_id, discount, price, quantity, subtotal FROM quote_services WHERE quote_id = p_quote_id` (y análogo para `quote_batches`→`service_order_batches` con `delivery_time`, y `quote_external_services`→`service_order_external_services`).
4. `UPDATE batch_reservations SET state = 'CONSUMED' WHERE quote_batch_id IN (SELECT id FROM quote_batches WHERE quote_id = p_quote_id) AND state = 'ACTIVE'`.
5. Recalcula el total de la orden **desde cero** (suma de las 3 tablas pivote completas de esa orden, no un delta incremental — más simple y a prueba de desincronización, mismo criterio que "revertir todo + reaplicar todo" en `/service-order-external-expense`):
   ```
   v_total     := SUM(service_order_services.subtotal) + SUM(service_order_batches.subtotal) + SUM(service_order_external_services.subtotal)  -- para p_service_order_id
   v_iva       := CASE WHEN service_orders.with_iva THEN v_total * 0.13 ELSE 0 END
   v_total_iva := v_total + v_iva
   v_must      := GREATEST((CASE WHEN with_iva THEN v_total_iva ELSE v_total END) - COALESCE(have, 0), 0)
   UPDATE service_orders SET total = v_total, iva = v_iva, total_iva = v_total_iva, must = v_must WHERE id = p_service_order_id;
   ```
   (`0.13` = mismo `IVA_RATE` que `service-order-form.ts`; si ese valor cambia, sincronizar aquí también.)
6. `UPDATE quotes SET state = 'CONVERTED', converted_service_order_id = p_service_order_id WHERE id = p_quote_id`.

**Flujo cliente — crear una orden nueva desde 1 o varias cotizaciones aprobadas:**
1. `tab-customer` de la orden permite seleccionar 1+ cotizaciones `APPROVED` del mismo cliente (autocomplete multi-select). Al elegir la primera, precarga `customer_id`/`vehicle_id` (igual que el diseño original de `/service-order-requires-quote`, pero sin bloquear a una sola).
2. `onSave()`: inserta la cabecera `service_orders` (totales en 0) → obtiene `order.id`.
3. Encadena `convert_quote_to_order(quote.id, order.id)` **secuencialmente** (`concatMap`, no `forkJoin`) por cada cotización seleccionada — si una falla, las anteriores ya convertidas quedan aplicadas y el error se atribuye claramente a una cotización puntual; no hay ambigüedad de "cuál falló".
4. Navega al detalle/dashboard con los totales ya recalculados por la última RPC.

**Flujo cliente — agregar una cotización a una orden `IN_PROGRESS` existente (trabajo extra):**
1. Nueva acción "Agregar cotización" en `ServiceOrderDetailModal` (o en un modo edición), visible solo si `order.state = 'IN_PROGRESS'`.
2. Autocomplete de cotizaciones `APPROVED` del mismo `customer_id` (+ `vehicle_id` si existe).
3. Llama `convert_quote_to_order(quote.id, order.id)` y refresca el detalle (`getWithLines`).

### 4.4 Expiración (sin cron disponible — resolución perezosa)

No hay job programado en el proyecto (las migraciones se corren a mano en Supabase). Se resuelve de forma perezosa con una función sin argumentos:

```sql
expire_overdue_quote_reservations() RETURNS VOID
```
Recorre `quotes` en `APPROVED` con `expiration_date < CURRENT_DATE`, libera sus reservas (`batch_reservations.state = 'EXPIRED'`) y pone `quotes.state = 'EXPIRED'`. Se invoca **best-effort** desde `SPQuote.listen()`/`get()` al cargar el dashboard de Cotizaciones (una llamada `rpc()` en paralelo, sin bloquear el listado si falla). No hace falta más precisión que esa — una cotización vencida que nadie mira hasta el día siguiente simplemente se limpia la próxima vez que alguien abre el módulo.

## 5. Stock disponible (nunca se toca `batches.stock` directamente)

```sql
available_stock(batch) = batches.stock
  - SUM(batch_reservations.quantity WHERE state='ACTIVE' AND reserved_until >= CURRENT_DATE)   -- cotizaciones aprobadas vigentes
  - SUM(service_order_batches.quantity WHERE service_orders.state='IN_PROGRESS')                 -- órdenes ya comprometidas
```

Exponer como **vista** `batch_available_stock(batch_id, stock, available_stock)` con `GRANT SELECT ... TO anon, authenticated` (las vistas no heredan RLS de la tabla base automáticamente; hay que otorgar el permiso explícito, igual que se hace `GRANT EXECUTE` en las RPCs).

- El buscador de repuestos de la cotización (`tab-parts` del módulo Quote) **debe** filtrar/mostrar por `available_stock`, no por `stock` crudo — es el punto entero de la reserva.
- Opcional, fuera del alcance mínimo: mostrar también `available_stock` en el `tab-parts` de `service-order` como dato informativo (hoy usa `stock` crudo). No es obligatorio para este rule; anótalo como mejora futura si no se hace ahora.
- **`batches.stock` sigue siendo el stock físico real**, ajustado solo por compras de lote (`apply_batch_purchase`/`reconcile_batch_purchase`, ya existentes). Este rule no cambia eso ni agrega descuento automático de stock al confirmar una orden — mantener ese comportamiento (o no) es una decisión aparte, fuera de este alcance.

## 6. Cálculos a nivel de contabilidad

- **La cotización no genera ningún movimiento en `bank_account_histories`.** Es un estimado; no hay `bank_transaction_types` nuevo que sembrar. El dinero solo se mueve cuando la orden resultante recibe un pago real vía `register_service_order_payment` (ya existente, sin cambios).
- **IVA espejado, no recalculado distinto:** la cotización usa el mismo criterio `with_iva` + `IVA_RATE = 0.13` que `service-order-form.ts`, para que el total que el cliente aprobó en la cotización coincida con el total que verá en la orden. `convert_quote_to_order` recalcula sobre las líneas ya insertadas, no copia el `total` de la cotización tal cual — así una orden con 2 cotizaciones convertidas siempre tiene un total consistente con la suma real de sus líneas, incluso si se agregaron en momentos distintos.
- **Margen (costo vs precio) visible por línea**, igual que hoy: `quote_batches`/`quote_external_services` ya traen `cost` (heredado de `batches`/`external_services`) y `price` — reutilizable para un futuro reporte de utilidad cotizada vs. vendida. `quote_services` no tiene `cost` porque `services` tampoco lo tiene hoy (mano de obra no tiene costo unitario registrado en el sistema) — no es un gap que este rule deba resolver.
- **`have`/`must` de la orden no se tocan al convertir una cotización más que por el recálculo del §4.3 paso 5** — si la orden ya tenía pagos (`have > 0`) antes de recibir una cotización adicional, `must` se recalcula contra el nuevo `total`, nunca se pisa `have`.
- Extensión natural habilitada por este diseño (no implementar ahora, solo dejar constancia): una vez que existan `quotes.state` y `converted_service_order_id`, un reporte de "tasa de conversión" (cotizado vs. efectivamente facturado) es una simple consulta agregada — no requiere cambios de esquema adicionales.

## 7. Pasos de implementación

1. **SQL** — agrega a `src/docs/database/migrate.sql` como `-- v22 — Quotes Module`:
   - Enums: `quote_state_enum`, `reservation_state_enum` (reutiliza `delivery_time_enum` existente).
   - Tablas: `quotes`, `quote_services`, `quote_batches`, `quote_external_services`, `batch_reservations`.
   - Vista: `batch_available_stock`.
   - RPCs: `reserve_quote_batches`, `release_quote_reservations`, `convert_quote_to_order`, `expire_overdue_quote_reservations` (con `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO anon, authenticated`, igual que las RPCs existentes).
   - `ALTER TABLE service_order_services/service_order_batches/service_order_external_services ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL`.
   - Trigger `set_updated_at()` para las 5 tablas nuevas (agregar a la lista `ARRAY[...]` existente).
   - RLS: `ENABLE ROW LEVEL SECURITY` + política `FOR ALL TO authenticated USING (true) WITH CHECK (true)` por tabla (patrón v10+, no las 4 políticas separadas del baseline viejo).
   - Índices: `quote_id` en las 3 tablas pivote de orden, `quote_id`/`batch_id`/`state` en `batch_reservations`, `customer_id`/`state` en `quotes`.
   - Sincroniza `src/docs/database/tables.sql` (baseline completo) y `src/docs/database/delete_bd.sql` (DROP en orden de dependencia: `batch_reservations` → `quote_batches`/`quote_services`/`quote_external_services` → `quotes`, y los `DROP FUNCTION`/`DROP VIEW` correspondientes, antes de `service_orders` porque `quotes.converted_service_order_id` referencia esa tabla).

2. **Modelo TypeScript** — `src/app/core/models/quote.model.ts`: `Quote`, `QuoteService`, `QuoteBatch`, `QuoteExternalService`, `BatchReservation`, y las variantes `Row` (con nombre para mostrar, igual que `ServiceOrderServiceRow` etc.) usadas en memoria durante el formulario. Reexporta/reutiliza `DeliveryTime` del modelo de `service-order.model.ts` (no lo dupliques).

3. **Servicios Supabase:**
   - `src/app/core/services/supabase/sb-quote.ts` — clase `SPQuote`: `get()`/`getById()`/`getWithLines()`/`add()`/`update()`/`bulkAddServices/Batches/ExternalServices()`/`deleteLinesByOrderId()`/`listen()` — mismo patrón que `sb-service-order.ts`. `listen()`/`get()` invoca `expire_overdue_quote_reservations` best-effort antes de devolver el listado (ver §4.4).
   - `src/app/core/services/supabase/sb-quote-conversion.ts` — clase `SPQuoteConversion` (mismo patrón que `sb-batch-purchase.ts`/`sb-service-order-external-expense.ts`: solo `.rpc(...)`, sin `forkJoin`): `approve(quoteId)` → `reserve_quote_batches`, `reject(quoteId)`/`cancel(quoteId)` → `release_quote_reservations`, `convertToOrder(quoteId, serviceOrderId)` → `convert_quote_to_order`.

4. **Componentes** — sigue el patrón de `service-order` (no el de `create-crud.md`, porque una cotización tiene tabs/líneas igual que una orden, no es un CRUD simple de un formulario plano):
   ```
   src/app/features/quote/
   ├── quote-form/                     ← crear/editar cotización (tabs: cliente, mano de obra, repuestos, externos)
   ├── quote-dashboard/                ← listado + búsqueda + detalle; tabs "Cotizaciones" (PENDING/APPROVED/CONVERTED) y "Anuladas" (REJECTED/EXPIRED/CANCELED), según `.claude/docs/features.md`
   └── components/
       ├── tab-customer/               ← cliente + vehículo + expiration_date (sin mecánico: no aplica a una cotización)
       ├── tab-labor/ tab-parts/ tab-external/   ← mismo patrón visual que service-order, filas propias (QuoteXRow)
       ├── quote-services-table/ quote-batches-table/ quote-external-services-table/
       └── quote-detail-modal/          ← detalle readonly + botón "Aprobar"/"Rechazar"/"Convertir a orden"/"Agregar a orden existente" según `state`
   ```
   `tab-parts` de Quote usa `batch_available_stock` (§5) en vez de `batches.stock` crudo, y permite agregar una fila con `batch_id = null` + `description` libre cuando el repuesto no está en inventario (`delivery_time` se fija a `ORDER` automáticamente en ese caso).

5. **Rutas** — lazy bajo `AdminLayout` en `app.routes.ts`: `/dashboard/cotizaciones/activas` (dashboard con las 2 tabs), `/dashboard/cotizaciones/nueva`.

6. **Menú** — `src/app/shared/components/nav-menu/nav-menu.ts`: agrega el grupo "Cotizaciones" ya definido en `features.md`.

7. **Integración en `service-order`:**
   - `tab-customer` de `service-order`: agrega selector multi-cotización `APPROVED` (opcional, no obligatorio — no repitas el `quote_id NOT NULL` del skill superado). Al elegir cotizaciones, precarga `customer_id`/`vehicle_id` de la primera seleccionada.
   - `service-order-form.ts`: tras crear la cabecera, encadena `convertToOrder` por cada cotización seleccionada (§4.3, flujo cliente).
   - `ServiceOrderDetailModal` (o vista de edición): botón "Agregar cotización" cuando `state === 'IN_PROGRESS'` (§4.3, segundo flujo).
   - No toques `sb-service-order.ts` más allá de que sus payloads ya incluyan `quote_id` (nullable) en las 3 tablas pivote — no cambia su forma de trabajar hoy (delete-all + re-insert-all al editar sigue igual; `quote_id` viaja con cada fila igual que cualquier otro campo).

## 8. Verificación obligatoria (correr antes de dar por terminada la implementación)

1. Crear cotización con 1 repuesto de inventario (stock 10, cantidad 3) → Aprobar → confirma 1 fila en `batch_reservations` `ACTIVE`, `available_stock` del lote baja a 7, `batches.stock` sigue en 10.
2. Crear una **segunda** cotización sobre el mismo lote pidiendo cantidad 8 → Aprobar debe **fallar** (excede `available_stock` = 7) sin dejar reservas parciales.
3. Rechazar la primera cotización → su reserva pasa a `RELEASED`, `available_stock` vuelve a 10; ahora la segunda cotización (cantidad 8) sí puede aprobarse.
4. Convertir una cotización `APPROVED` a una orden nueva → la reserva pasa a `CONSUMED`, las 3 tablas pivote de la orden tienen filas con `quote_id` seteado, `service_orders.total/iva/total_iva/must` quedan calculados correctamente, la cotización queda `CONVERTED` con `converted_service_order_id` apuntando a la orden.
5. Con esa orden `IN_PROGRESS`, aprobar y convertir una **segunda** cotización del mismo cliente hacia la **misma orden** → los totales se recalculan sumando ambas cotizaciones (no se pisan), `have` no cambia, `must` sí se ajusta.
6. Cotización con `expiration_date` vencido y aún `APPROVED` → al abrir el dashboard de Cotizaciones, pasa a `EXPIRED` y su reserva a `EXPIRED`, liberando el stock.
7. Cotización con una línea `batch_id = null` + descripción libre ("Kit de embrague — por pedido") → se guarda sin generar ninguna fila en `batch_reservations`, y se convierte igual a la orden como una línea de repuesto normal.

## 9. Consideraciones finales

- Sigue las convenciones del `CLAUDE.md`: standalone components, signals, Angular Material, sin HTTP directo (todo vía Supabase/RPC).
- No repliques el patrón "revertir + reaplicar" completo de `/service-order-external-expense` para las reservas — aquí el ciclo de vida es distinto (`reserve` una vez al aprobar, `release`/`consume` una vez al rechazar/convertir), no hay ediciones repetidas de una cotización ya aprobada. Si se necesita editar una cotización `APPROVED` (cambiar cantidades), la forma más simple y seguro es: `release_quote_reservations` primero (vuelve a `PENDING`), editar, volver a aprobar — no inventes una reconciliación fina para esto.
- No agregues un `bank_transaction_type` nuevo para cotizaciones — no hay movimiento bancario en este módulo.
- No hagas obligatoria la cotización para crear una orden — mantén compatibilidad con el flujo de trabajo rápido existente (`/service-order-quick-register`, órdenes creadas sin cotización previa para trabajos menores).
