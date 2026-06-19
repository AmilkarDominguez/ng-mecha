Mueve el mecánico de por-servicio a uno solo por orden de servicio completa

Utiliza un razonamiento: adaptive thinking

## Contexto
Actualmente en la orden de servicio, el mecánico se selecciona en el Tab 2 (Mano de Obra) por cada ítem de `service_order_services`.
El cambio requerido es: **un solo mecánico para toda la orden de servicio**, no por cada línea de mano de obra.
Esto implica:
- Quitar `mechanic_id` de `service_order_services` y moverlo a `service_orders`.
- Quitar el selector de mecánico del Tab 2.
- Agregar el selector de mecánico en el Tab 1 (Cliente) o en el panel de información de la orden.
- Quitar la columna "Técnico" de la tabla `service-order-services-table`.

## Archivos clave
- `src/app/features/service-order/components/tab-labor/tab-labor.ts` — Tab 2 (Mano de Obra)
- `src/app/features/service-order/components/tab-customer/tab-customer.ts` — Tab 1 (Cliente)
- `src/app/features/service-order/components/service-order-services-table/` — Tabla de servicios
- `src/app/features/service-order/service-order-form/service-order-form.ts` — Formulario principal
- `src/app/core/models/service-order.model.ts` — Modelos de la orden
- `src/app/core/services/supabase/sb-service-order.ts` — Servicio Supabase

## Pasos

1. **Actualiza `entities.md`**
   - En `.claude/docs/entities.md`, en la entidad `ServiceOrder`, agrega `mechanic_id | UUID (FK) | nullable → mechanics.id`.
   - En la entidad `ServiceOrderService`, elimina la columna `mechanic_id`.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/service-order.model.ts`:
     - Agrega `mechanic_id?: string | null` a la interfaz `ServiceOrder`.
     - Elimina `mechanic_id` de la interfaz `ServiceOrderServiceRow`.
     - Elimina `mechanic_name` de `ServiceOrderServiceRow`.

3. **Actualiza el Tab 1 (Cliente) — `tab-customer.ts`**
   - Agrega un selector de mecánico con autocompletado (igual al que había en tab-labor).
   - Inyecta `SPMechanic` y carga la lista de mecánicos activos.
   - Agrega `mechanic_id: string | null` a la interfaz `CustomerTabValue` exportada.
   - Emite el `mechanic_id` seleccionado en el output `valueChange`.

4. **Actualiza el Tab 2 (Mano de Obra) — `tab-labor.ts`**
   - Elimina completamente el `FormControl` y `MatAutocomplete` de mecánico.
   - Elimina la inyección de `SPMechanic`.
   - Elimina `mechanic_id` y `mechanic_name` del objeto emitido en `addItem`.
   - El output `addItem` ya no lleva datos de mecánico.

5. **Actualiza la tabla de servicios — `service-order-services-table`**
   - Elimina la columna "Técnico" (`mechanic_name`) de la tabla.
   - Elimina la columna de la definición `displayedColumns`.

6. **Actualiza el formulario principal — `service-order-form.ts`**
   - Lee `mechanic_id` desde `customerTabValue().mechanic_id`.
   - Al construir el payload de `service_orders`, incluye `mechanic_id`.
   - Al guardar `servicesToSave`, ya no mapea `mechanic_id` por ítem.

7. **Actualiza el servicio Supabase**
   - En `src/app/core/services/supabase/sb-service-order.ts`, incluye `mechanic_id` en el payload del método `add`.
   - En `bulkAddServices`, elimina el campo `mechanic_id` del payload de cada ítem.

8. **Actualiza la base de datos**
   - En `src/docs/database/migrate.sql`:
     ```sql
     ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS mechanic_id UUID REFERENCES mechanics(id);
     ALTER TABLE service_order_services DROP COLUMN IF EXISTS mechanic_id;
     ```
   - En `src/docs/database/tables.sql`: refleja los mismos cambios estructurales.

## Consideraciones
- El selector de mecánico en Tab 1 debe seguir el mismo patrón de autocompletado que el selector de cliente (`MatAutocomplete`).
- Si no se selecciona mecánico, `mechanic_id` va como `null` — el campo es opcional.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
- Verifica que no queden referencias a `mechanic_name` en ningún template HTML del feature.
