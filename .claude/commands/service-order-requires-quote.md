Vincula obligatoriamente una cotización a cada orden de servicio

> ⚠️ **Superado por `.claude/commands/quote-module.md`.** El diseño original de este archivo (un único `service_orders.quote_id NOT NULL`, relación 1:1) no soporta el flujo real del taller: una orden puede nacer de varias cotizaciones aprobadas, y una orden ya `IN_PROGRESS` puede recibir cotizaciones adicionales (ej. daños extra encontrados durante el servicio). El módulo de Cotizaciones implementa el vínculo a nivel de línea (`quote_id` nullable en `service_order_services`/`service_order_batches`/`service_order_external_services`) y a nivel de cotización (`quotes.converted_service_order_id`), sin FK obligatoria de cabecera. Usa `quote-module.md` como referencia; este archivo se conserva solo como historial de la primera intención de diseño.

Utiliza un razonamiento: adaptive thinking

## Contexto
Las órdenes de servicio deben requerir una cotización previa. 
El flujo esperado es: **Cotización aprobada → Orden de Servicio generada desde esa cotización**.
La entidad `ServiceOrder` necesita el campo `quote_id` como referencia a la cotización origen.

> Antes de implementar, leer:
> - `.claude/docs/entities.md` — esquema de Quote y ServiceOrder
> - `.claude/docs/features.md` — módulo Cotizaciones
> - `src/app/features/service-order/service-order-form/service-order-form.ts` — formulario actual

## Pasos

1. **Actualiza `entities.md`**
   - En la entidad `ServiceOrder`, agrega `quote_id | UUID (FK) | not null → quotes.id`.
   - Si la entidad `Quote` no existe, créala con campos básicos: `id`, `customer_id`, `vehicle_id`, `state` (enum: `PENDING`, `APPROVED`, `REJECTED`), `total`, `created_at`, `updated_at`.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/service-order.model.ts`, agrega `quote_id: string` (requerido) a la interfaz `ServiceOrder`.
   - Si el modelo `Quote` no existe, créalo en `src/app/core/models/quote.model.ts`.

3. **Actualiza el Tab 1 del formulario de orden de servicio**
   - En `src/app/features/service-order/components/tab-customer/tab-customer.ts`:
     - Agrega un selector de cotización con autocompletado **antes** del selector de cliente.
     - Muestra solo cotizaciones con `state: APPROVED`.
     - Al seleccionar una cotización, pre-carga automáticamente: `customer_id` y `vehicle_id` de la cotización en los selectores correspondientes (bloqueados en modo lectura si vienen de la cotización).
     - Agrega `quote_id: string | null` a la interfaz `CustomerTabValue`.
   - Si no se selecciona cotización, el botón "Registrar" del formulario debe estar deshabilitado y mostrar un mensaje de validación.

4. **Crea el servicio de cotizaciones** (si no existe)
   - En `src/app/core/services/supabase/sb-quote.ts`, crea la clase `SPQuote` con método `get()` que retorne las cotizaciones (datos mock por ahora).
   - Los datos mock deben incluir cotizaciones con `state: APPROVED` para que el selector tenga opciones.

5. **Actualiza el formulario principal — `service-order-form.ts`**
   - Lee `quote_id` desde `customerTabValue().quote_id`.
   - Incluye `quote_id` en el payload al llamar a `serviceOrderProvider.add()`.
   - Deshabilita el botón "REGISTRAR" si `!customerTabValue()?.quote_id`.

6. **Actualiza el servicio Supabase**
   - En `src/app/core/services/supabase/sb-service-order.ts`, incluye `quote_id` en el payload del método `add`.

7. **Actualiza la base de datos**
   - En `src/docs/database/tables.sql`: agrega la tabla `quotes` si no existe, y agrega `quote_id UUID NOT NULL REFERENCES quotes(id)` en `service_orders`.
   - En `src/docs/database/migrate.sql`:
     ```sql
     -- Si quotes no existe:
     CREATE TABLE IF NOT EXISTS quotes (...);
     -- Si service_orders ya existe:
     ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);
     ```
   - En `src/docs/database/delete_bd.sql`: agrega el DROP de `quotes` antes del DROP de `service_orders`.

## Consideraciones
- El selector de cotización debe mostrar información relevante: número de cotización, nombre del cliente, total y fecha.
- Si el módulo de Cotizaciones (`src/app/features/`) aún no existe, los datos de cotización se simulan con un mock en el servicio.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
- La validación de cotización requerida debe ser visible para el usuario antes de intentar registrar.
