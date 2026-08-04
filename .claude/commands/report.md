Implementa el reporte `$ARGUMENTS` del módulo de Reportes.

Utiliza un razonamiento: adaptive thinking

## Contexto

`$ARGUMENTS` identifica **un solo** reporte de `.claude/docs/reports.md` (ej. "Utilidades",
"A.4", "Lotes - Stock", "Home view: Cumpleañeros del mes", "Servicios hechos por técnico").
Ese documento es la fuente de verdad de qué es cada reporte, para qué sirve y qué riesgos de
datos ya se identificaron — **no reinterpretes el reporte desde cero**, léelo primero.

Este comando implementa **un reporte a la vez**. Si `$ARGUMENTS` no matchea claramente una
sola entrada de `reports.md` (nombre ambiguo, o coincide con varias), detente y pide al
usuario que aclare cuál — no implementes varios reportes en una misma corrida ni adivines.

A diferencia de `income-report`/`expense-report` (que solo leían una tabla ya poblada), varios
de estos reportes **sí requieren tocar el esquema y/o poblar datos de prueba** para ser
verificables — este comando lo cubre explícitamente en los pasos 2 y 3, no lo omitas aunque el
reporte "parezca" solo de lectura.

## Pasos

1. **Localiza y relee la definición del reporte**
   - Busca en `.claude/docs/reports.md` la sección (A.x / B.x / C.x) que corresponde a
     `$ARGUMENTS`. Extrae: Definición, Finalidad, Datos/entidades, y cualquier "Riesgo de
     datos" o nota de solapamiento con otro reporte.
   - Si la sección referencia otro reporte por solapamiento (ej. A.2 ↔ C.6, A.1 ↔ C.2), decide
     explícitamente si este reporte reemplaza/incluye al otro o si serán independientes, y dilo
     en tu resumen final — no lo dejes implícito.
   - Revisa también `.claude/docs/entities.md` para confirmar el esquema actual de las tablas
     involucradas antes de asumir nada del punto 2.

2. **Evalúa si hace falta cambiar el modelo de datos — hazlo si es necesario**
   - Compara lo que el reporte necesita mostrar/filtrar contra las columnas que ya existen.
     Ejemplos ya anticipados en `reports.md` (no exhaustivo — puede haber otros según el
     reporte que te toque):
     - "Lotes - Stock" / "Home view: Lotes en bajo stock" necesitan un umbral de "bajo stock"
       que `batches` no tiene hoy — decide entre agregar una columna (`min_stock` o
       `reorder_point` en `batches`) o un umbral global en `workshop_settings`, y documenta la
       decisión.
     - "Utilidades" / "¿Cuánto estoy ganando por productos?" dependen de `batches.cost`, que es
       el costo **actual**, no histórico — si el reporte necesita precisión histórica real,
       agrega una columna de costo congelado a `service_order_batches` (ej.
       `cost_at_sale NUMERIC(8,2)`), poblada al insertar la línea (`bulkAddBatches` en
       `sb-service-order.ts`), en vez de recalcular con el costo actual del lote.
   - Si se requiere un cambio de esquema:
     - Agrega la columna/tabla en `src/docs/database/tables.sql` (definición base) **y** como
       migración versionada nueva en `src/docs/database/migrate.sql` (siguiente número de
       versión, sigue el patrón `-- v<N> ...` ya usado — revisa la última versión en el
       archivo antes de numerar). Actualiza `delete_bd.sql` si agregas una tabla nueva (no
       hace falta si solo agregas una columna).
     - Actualiza el modelo TS correspondiente en `src/app/core/models/` y cualquier
       `select()`/payload en `src/app/core/services/supabase/sb-*.ts` que toque esa tabla.
     - Si agregas una columna a una tabla pivote de orden (`service_order_*`), respeta la
       regla de trazabilidad de `[[service-order-flow]]` §5/§11: agrégala también en
       `toXRow()` y `saveLines()` de `service-order-form.ts`, o se pierde al editar una orden.
   - Si **no** hace falta ningún cambio de esquema, dilo explícitamente en tu resumen ("no se
     requirió cambio de modelo") — no es obligatorio que cada reporte lo necesite, pero debes
     haberlo evaluado a propósito, no omitido.

3. **Evalúa si hacen falta datos seeder — créalos si el reporte no tendría datos para mostrar**
   - Revisa `src/docs/database/seed.sql`: es idempotente (ids fijos +
     `ON CONFLICT (id) DO NOTHING`), sigue la convención de ids
     `00000000-0000-0000-<entidad>-<secuencia>` documentada en su cabecera, y ya sabe qué
     número de entidad corresponde a cada tabla — reutiliza esa numeración, no inventes otra.
   - Si el reporte filtra por **fechas relativas a "hoy"** (ej. cumpleañeros del mes en curso,
     órdenes con `return_date` próxima a vencer, utilidades del mes) los datos ya sembrados en
     `seed.sql` pueden no caer dentro del rango esperado al momento de probar. Agrega filas de
     seed nuevas con fechas relativas al momento de implementación que sí caigan dentro del
     rango relevante (ej. un cliente con `birthdate` en el mes actual, una orden con
     `return_date` = hoy + unos días), además de al menos un caso fuera de rango para verificar
     que el filtro efectivamente excluye.
   - Si el reporte agrupa/rankea (ej. servicios más requeridos, productos que más se venden),
     asegúrate de que el seed tenga **suficientes filas repetidas** para que el ranking no sea
     trivial (todo empatado en 1) — varía las cantidades entre filas.
   - Agrega las filas nuevas al final de la sección correspondiente de `seed.sql` (o crea una
     sección nueva numerada si el reporte requirió una tabla nueva en el paso 2), manteniendo
     el estilo de comentarios existente.
   - Si el reporte solo lee tablas que **ya** tienen suficiente variedad de datos para ejercer
     sus filtros (verifícalo leyendo `seed.sql`, no lo asumas), no agregues seed redundante —
     dilo en tu resumen.

4. **Servicio Angular (capa de datos)**
   - Sigue el patrón de `income-report.md`/`expense-report.md`: un método de solo lectura en el
     `SPXxx` ya existente si el reporte reutiliza una tabla con servicio propio (ej.
     `sb-batch.ts`, `sb-service-order.ts`), o un servicio nuevo en `core/services/supabase/` si
     no hay uno natural.
   - **Generaliza en vez de duplicar** si dos reportes de `reports.md` comparten la misma
     forma de query (mismo criterio que `getIncome` → `getByTransactionKind` en
     `expense-report.md`) — revisa si el reporte que estás implementando ya tiene un método
     parecido de otro reporte hermano antes de escribir uno nuevo desde cero.
   - Si el reporte necesita stock, usa `batch_available_stock` / `SPBatch.getAvailableStock()`
     — nunca `batches.stock` a secas (ver `reports.md` A.4/B.2 y `[[quotes-service-orders]]`).
   - Nunca calcules totales/utilidades en el cliente con múltiples llamadas encadenadas
     (`forkJoin` sobre pasos dependientes) si el cálculo puede hacerse en una sola query
     agregada de Postgres — pero para un reporte de solo lectura simple, una query con
     `select`/`.gte`/`.lte`/joins desde el cliente (como `income-report`) es aceptable; no
     escribas una RPC nueva a menos que el cálculo sea imposible de expresar con PostgREST.

5. **Feature Angular (UI)**
   - Carpeta `src/app/features/reports/<slug>/` (slug en kebab-case derivado del nombre del
     reporte), componente `<Slug>ReportDashboard`, standalone, imports de Angular Material
     individuales (sin barrel imports).
   - Formulario de filtros (`FormGroup` reactivo) con botón "Buscar" explícito — **no**
     consultes en cada `valueChanges`, mismo criterio que `income-report-dashboard`.
   - Tabla `mat-table` de solo lectura (sin acciones de editar/eliminar — estos son reportes,
     no CRUDs), con fila vacía tipo `*matNoDataRow` con mensaje descriptivo.
   - Si el reporte tiene un total/resumen, usa un `computed()` sobre las filas cargadas y
     muéstralo con las clases `summary-row`/`summary-value` ya usadas en el proyecto
     (`service-order-detail-modal.scss`).
   - SCSS en `rem`, sin `!important`, sin estilos inline en el HTML — ver convenciones de
     `CLAUDE.md`.
   - Si el reporte es uno de los "Home view" (B.1/B.2), en vez de un dashboard con ruta propia
     va como componente widget dentro de `src/app/features/dashboard/components/`, montado
     junto a (no en reemplazo de) `<app-birthday-card />` en `dashboard.html`.

6. **Ruta y menú (solo para reportes con dashboard propio, no para los widgets de Home view)**
   - Ruta en `app.routes.ts`, bajo los children de `AdminLayout`:
     `path: 'reportes/<slug>'`, `loadComponent` lazy.
   - Item nuevo en `nav-menu.ts`, dentro del grupo `title: 'Reportes'` (hoy `items: []`) — es
     el destino obligatorio de todo reporte nuevo (decisión explícita del usuario, ver
     `[[features-navigation]]` §5). No reutilices el prefijo `cuentas/` ni el grupo `'Cuentas'`
     aunque el reporte se sienta financiero (ej. Utilidades) — Ingresos/Egresos ya están ahí
     por una decisión anterior que no se extiende a reportes nuevos.

7. **Actualiza `.claude/docs/reports.md`**
   - Cambia el campo **Estado** de la sección implementada de "no implementado" a
     "implementado" (o "implementado parcialmente" si quedó algo pendiente — dilo).
   - Si tomaste una decisión de esquema o de seed que resuelve un "Riesgo de datos" anotado en
     el documento, reemplaza esa nota por la decisión real tomada (ej. "se agregó
     `batches.min_stock`" en vez de "hace falta decidir...").
   - Si el paso 1 detectó solapamiento con otro reporte, refleja aquí la resolución.

## Consideraciones

- Un reporte por corrida de este comando — si el usuario quiere varios, se invoca este comando
  una vez por cada uno.
- Nunca implementes acciones de escritura (crear/editar/eliminar) sobre las entidades que el
  reporte solo lee — sigue siendo un reporte de solo lectura aunque el paso 2 haya requerido
  cambiar el esquema.
- Cambiar el modelo de datos y agregar seed son pasos **condicionales**, no automáticos: solo
  hazlos si el análisis del paso 1/2/3 los justifica, y dilo explícitamente en ambos sentidos
  (se hizo / no hizo falta) en tu resumen final.
- Sigue las convenciones del CLAUDE.md: standalone components, signals, Reactive Forms,
  kebab-case de archivos, sin HTTP directo (todo vía Supabase), Angular Material por
  componente.
