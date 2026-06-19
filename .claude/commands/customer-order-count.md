Agrega el conteo de órdenes de servicio por cliente en el módulo de Clientes

Utiliza un razonamiento: adaptive thinking

## Contexto
Se necesita mostrar cuántas órdenes de servicio tiene cada cliente en la tabla y/o detalle del módulo de Clientes (`src/app/features/workshop/customers/`).
Esto ayuda a identificar rápidamente la frecuencia de visitas de cada cliente.

## Pasos

1. **Actualiza el servicio de clientes**
   - En `src/app/core/services/supabase/sb-customer.ts`, agrega un método `getWithOrderCount()` (o modifica `get()`) que haga un join o consulta adicional para obtener el conteo de órdenes de servicio por cliente.
   - Ejemplo de query Supabase: `select('*, service_orders(count)')` — esto retorna el conteo embebido.
   - Si el servicio usa datos mock, agrega el campo `order_count: number` en los datos de prueba.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/customer.model.ts`, agrega `order_count?: number` como campo opcional en la interfaz `Customer` (o crea una interfaz derivada `CustomerWithCount`).

3. **Actualiza la tabla de clientes**
   - En `src/app/features/workshop/customers/components/customer-table/`, agrega una columna "Órdenes" que muestre el conteo `order_count` de cada cliente.
   - Ubícala antes de la columna de acciones.
   - Si el valor es `0` o `undefined`, mostrar `0`.

4. **Actualiza el modal de detalles del cliente**
   - En `src/app/features/workshop/customers/components/customer-detail-modal/`, agrega una sección que muestre "Total de órdenes de servicio: N".

5. **Actualiza el dashboard de clientes**
   - En `src/app/features/workshop/customers/customer-dashboard.ts`, usa el método actualizado del servicio que incluye el conteo.

## Consideraciones
- Toma como referencia los componentes existentes en `src/app/features/workshop/customers/`.
- Si Supabase no soporta el conteo embebido directamente, usa una segunda consulta en el servicio y combina los resultados con `combineLatest` o `forkJoin` de RxJS.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
- No modifica la estructura de la base de datos (es solo lectura).
