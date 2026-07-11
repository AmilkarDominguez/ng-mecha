Agrega el conteo de órdenes de servicio por cliente en el módulo de Clientes

Utiliza un razonamiento: adaptive thinking

## Contexto
Se necesita mostrar cuántas órdenes de servicio tiene cada cliente en la tabla y/o detalle del módulo de Clientes (`src/app/features/workshop/customers/`).
Esto ayuda a identificar rápidamente la frecuencia de visitas de cada cliente.

## Pasos

1. **Actualiza el servicio de clientes**
   - En `src/app/core/services/supabase/sb-customer.ts`, dentro de `get()`, amplía el `select('*')` actual a `select('*, service_orders(count)')`. **Verificado contra el Supabase real del proyecto**: PostgREST soporta el conteo embebido vía la FK `service_orders.customer_id → customers.id` y devuelve la forma `service_orders: [{ count: N }]` (array de un solo elemento), no un número plano.
   - `get()` ya hace un segundo query para traer `contacts` y mergearlos manualmente (mismo archivo, líneas ~23-44) — sigue exactamente ese mismo patrón: al mapear `customers.map((c) => ({ ...c, contacts: ... }))`, agrega también `order_count: (c as any).service_orders?.[0]?.count ?? 0` y elimina la propiedad cruda `service_orders` del objeto final para no filtrarla al resto de la app.
   - No crees un método nuevo `getWithOrderCount()` — el dashboard de clientes ya usa `service.listen()` que internamente llama a `get()`; ampliar `get()` directamente evita tener dos fuentes de verdad.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/customer.model.ts`, agrega `order_count?: number` como campo opcional en la interfaz `Customer` (junto a `contacts?: Contact[]`).

3. **Actualiza la tabla de clientes**
   - En `src/app/features/workshop/customers/components/customer-table/customer-table.ts`, agrega `'orderCount'` al array `displayedColumns` (antes de `'actions'`), y un caso `case 'orderCount': return item.order_count ?? 0;` en `sortingDataAccessor` para que la columna sea ordenable (sigue el mismo patrón que las demás columnas de esa tabla, que usa `MatTableDataSource` + `MatSort`, a diferencia de otras tablas del proyecto que no ordenan).
   - En `customer-table.html`, agrega la columna "Órdenes" (`matColumnDef="orderCount"`) mostrando `{{ customer.order_count ?? 0 }}`, ubicada antes de la columna de acciones.

4. **Actualiza el modal de detalles del cliente**
   - En `src/app/features/workshop/customers/components/customer-detail-modal/`, agrega una sección/`detail-section` que muestre "Órdenes de Servicio" con el valor `customer.order_count ?? 0`.

5. **Dashboard de clientes**
   - No requiere cambios: `customer-dashboard.ts` ya usa `toSignal(this.service.listen(), ...)`, que reflejará automáticamente el `order_count` una vez ampliado `get()`.

## Consideraciones
- Toma como referencia los componentes existentes en `src/app/features/workshop/customers/`.
- El conteo embebido de PostgREST ya fue probado y funciona en este proyecto — no hace falta el fallback de `combineLatest`/`forkJoin` con una segunda consulta a `service_orders`.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
- No modifica la estructura de la base de datos (es solo lectura).
- Cuidado con `add()`/`update()` en `sb-customer.ts`: ya destructuran `contacts` fuera del payload antes de insertar/actualizar; si `order_count` llega a estar presente en el objeto pasado a esos métodos (no debería, es derivado y de solo lectura), tampoco debe enviarse a Supabase — decestrúctúralo igual que `contacts` por seguridad.
