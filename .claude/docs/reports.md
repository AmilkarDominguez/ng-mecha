# Reportes del sistema — reglas, definición y finalidad

Documento de referencia (planificación) para el módulo de **Reportes**, que hoy vive como
grupo de menú vacío en `nav-menu.ts` (`title: 'Reportes'`, `items: []` — ver
`[[features-navigation]]` §2). **Ninguno de los reportes listados aquí está implementado
todavía**, salvo las dos excepciones marcadas explícitamente abajo (Ingresos/Egresos e
Cumpleañeros del mes). Este documento existe para que, al implementar cualquiera de ellos,
exista una sola fuente de verdad sobre qué es cada uno, para qué sirve y qué datos reales del
proyecto consume — antes de escribir el comando/spec de implementación (estilo
`.claude/commands/income-report.md`).

**Todo reporte nuevo de este documento debe agregarse al grupo de menú "Reportes"** — es una
decisión explícita del usuario (2026-08-03), no una convención implícita. Esto **no** mueve
Ingresos/Egresos (siguen en "Cuentas", ya implementados) pero sí aplica a los 12 reportes
restantes de este documento, aunque alguno se sienta "financiero" (como A.1 Utilidades) — no
lo agregues al grupo "Cuentas" por parecido temático.

Documentos relacionados:
- `[[features-navigation]]` §4 — convención para agregar un módulo nuevo (carpeta, ruta, menú).
  §5 — antes de implementar algo de "Reportes", verificar aquí que no exista ya con otro
  nombre (Ingresos/Egresos ya viven bajo "Cuentas", no bajo este grupo).
- `.claude/docs/entities.md` — esquema completo de entidades referenciadas abajo.
- `.claude/commands/income-report.md` / `expense-report.md` — patrón de spec de
  implementación a seguir para cada reporte nuevo (filtros, tabla de solo lectura, sin
  CRUD).
- `[[service-order-flow]]`, `[[quotes-service-orders]]`, `[[bank-manual-movements]]` —
  detalle de las tablas que la mayoría de estos reportes consultan.

**Convención de carpeta/ruta al implementar:** `src/app/features/reports/<reporte>/`, ruta
`dashboard/reportes/<reporte>` en `app.routes.ts`, item nuevo dentro del grupo de menú
`'Reportes'` (hoy `items: []`) — no reutilizar el prefijo `cuentas/` (ese ya está
tomado por Ingresos/Egresos, que son casos distintos aunque relacionados). Todos son
reportes de **solo lectura** (sin crear/editar/eliminar), mismo criterio que
`income-report-dashboard`/`expense-report-dashboard`.

---

## A. Reportes principales

### A.1 — [Reporte] Utilidades

**Estado:** implementado (2026-08-03). Ruta `/dashboard/reportes/utilidades`, menú "Reportes
→ Utilidades", carpeta `src/app/features/reports/utility-report/`
(`UtilityReportDashboard`).

**Definición:** reporte financiero que, para un rango de fechas (filtro por
`service_orders.started_date`, ambos extremos opcionales), compara el ingreso generado por
cada orden de servicio (`service_orders.total`, **sin IVA** — el IVA es un impuesto de paso,
no ganancia del taller) contra el costo asociado a sus líneas de repuestos
(`service_order_batches.cost_at_sale`) y servicios externos
(`service_order_external_services.cost`), mostrando la utilidad neta (ingreso − costo) por
orden y un resumen agregado (ingreso/costo/utilidad totales del rango). Mano de obra
(`service_order_services`) no tiene costo asociado — es 100% utilidad.

**Finalidad:** responder "¿cuánto está ganando el taller realmente?", más allá del total
facturado — es el reporte gerencial de rentabilidad, distinto de los reportes de Ingresos/
Egresos (`accounting/income-report`, `accounting/expense-report`) que solo listan movimientos
de `bank_account_histories` sin calcular margen.

**Datos/entidades:** `service_orders`, `service_order_services` (sin costo — 100% utilidad de
mano de obra), `service_order_batches` (`price` vs `cost_at_sale`), `service_order_external_services`
(`price` vs `cost`, ya vienen ambos en la línea).

**Decisión de esquema tomada (resuelve el riesgo de datos original):** se agregó
`service_order_batches.cost_at_sale NUMERIC(8,2)` (nullable) — costo del lote **congelado** al
momento de la venta, en vez de recalcular con `batches.cost` actual. Se puebla en los dos
puntos donde se inserta una línea de repuesto en una orden:
- `tab-parts.ts` (`onAdd()`) — copia `batch.cost` del lote seleccionado al agregar la línea
  manualmente en el formulario de orden.
- RPC `convert_quote_to_order` (`migrate.sql` v26) — copia `batches.cost` vía `LEFT JOIN` al
  convertir una cotización a orden (las cotizaciones no tienen costo propio, `quote_batches`
  nunca lo tuvo).

`service-order-form.ts` (`toBatchRow()`/`saveLines()`) preserva `cost_at_sale` al editar una
orden, siguiendo la misma regla de trazabilidad que `quote_id`
(ver `[[service-order-flow]]` §5/§11). Filas insertadas **antes** de esta migración quedan con
`cost_at_sale = NULL`; `SPServiceOrder.getUtilityReport()` cae a `batches.cost` (costo actual)
para esas filas vía `LEFT JOIN` embebido — limitación conocida y aceptada solo para datos
históricos previos a v26, documentada en el propio código
(`sb-service-order.ts::toUtilityRow`). Relacionado con C.2 "¿Cuánto estoy ganando por
productos?", que es el mismo cálculo pero acotado solo a repuestos y ahora puede reutilizar
`cost_at_sale` sin repetir esta decisión.

### A.2 — [Reporte] Productos (Lotes)

**Estado:** implementado (2026-08-03). Ruta `/dashboard/reportes/productos-lotes`, menú
"Reportes → Productos (Lotes)", carpeta `src/app/features/reports/product-sales-report/`
(`ProductSalesReportDashboard`).

**Definición:** reporte de movimiento de inventario que lista productos/lotes vendidos en
órdenes de servicio (`service_order_batches`) en un rango de fechas (filtro opcional por
`service_orders.started_date`), agrupado por producto, con cantidad vendida total e ingreso
generado (suma de `subtotal`) por producto.

**Finalidad:** saber qué productos rotan más, como insumo para decisiones de compra y
reposición — complementa (no reemplaza) al reporte de Stock (A.4): este mira **movimiento**
(qué se vendió), Stock mira **existencia actual** (qué queda).

**Datos/entidades:** `service_order_batches` (`batch_id`, `quantity`, `subtotal`) → join a
`batches.product_id` → `products.name`; filtro de fecha vía join `!inner` a
`service_orders.started_date` (mismo patrón que `SPBankAccountHistory.getByTransactionKind`).

**Resolución de la nota de solapamiento (C.6):** el documento original marcaba este reporte
como "cercano al extra C.6" (texto corregido — decía "B.6" por error de tipeo, no existe grupo
B.6; el ranking al que se refiere es C.6 "qué lotes se venden más por producto"). Se decidió
**no implementar C.6 como reporte separado**: `getProductSalesReport()` ya devuelve las filas
**ordenadas por cantidad vendida descendente** por defecto, así que la tabla de A.2 sirve
directamente como el ranking/top que pedía C.6, sin una segunda pantalla. Si en el futuro se
necesita un "top N" recortado o una vista visualmente distinta (ej. gráfico de barras), es una
variación de la UI de A.2, no una nueva fuente de datos — reutilizar
`SPServiceOrder.getProductSalesReport()`.

**Cambio de esquema:** no se requirió — `quantity`, `subtotal` y el join a `products.name` ya
existían.

### A.3 — [Reporte] Cumpleañeros

**Estado:** implementado (2026-08-03). Ruta `/dashboard/reportes/cumpleaneros`, menú
"Reportes → Cumpleañeros", carpeta `src/app/features/reports/birthday-report/`
(`BirthdayReportDashboard`). `B.1` (`BirthdayCard` en el Dashboard) **sigue existiendo tal
cual** — no fue reemplazado ni modificado; A.3 es el reporte completo y filtrable, B.1 sigue
siendo la alerta rápida de un vistazo al entrar al sistema (ver relación abajo).

**Definición:** listado completo de clientes y mecánicos cuyo cumpleaños cae en un **mes**
seleccionado (selector de mes, no limitado al mes actual — se puede consultar cualquier mes
del año, incluyendo meses futuros). Se optó por filtro de mes en vez de rango de fechas
arbitrario: un cumpleaños es una recurrencia anual (solo importa día+mes, no el año), y un
rango de fechas libre complicaría el cruce de año (ej. 15-dic a 15-ene) sin aportar valor real
sobre "planificar el próximo mes" — la definición original permitía "por mes **o** rango de
fechas", se tomó la opción más simple y suficiente para la finalidad declarada.

**Finalidad:** permitir planificar campañas de fidelización o saludos con anticipación
(cualquier mes, incluyendo futuros), a diferencia del widget de Dashboard que solo muestra el
mes en curso.

**Datos/entidades:** `customers.birthdate`, `mechanics.birthdate`. A diferencia del widget
B.1 (solo `customers`), A.3 combina **ambas** entidades en una sola tabla con columna "Tipo"
(Cliente/Mecánico), tal como este documento ya anticipaba.

**Cambio de esquema:** no se requirió — ambas columnas `birthdate` ya existían.

**Capa de datos:** no se creó ningún método nuevo en `core/services/supabase/` — se
reutilizan `SPCustomer.listen()` y `SPMechanic.listen()` ya existentes (mismos que usa
`BirthdayCard`), filtrando por mes y combinando ambas listas en el propio componente
(`computed()`), igual que la lógica ya usada en `birthday-card.ts` pero generalizada a mes
seleccionable + dos entidades.

**Seed:** se agregó una clienta (`Patricia`, id `...-0010-000000000005`) y un mecánico
(`Diego`, id `...-0012-000000000004`) con `birthdate` en agosto (mes en curso al momento de
esta implementación), para que el reporte muestre datos no vacíos con el filtro por defecto
(mes actual). Los clientes/mecánicos ya sembrados (marzo/julio/noviembre/enero/mayo/
septiembre/diciembre) sirven como casos "fuera de rango" para verificar que el filtro de mes
excluye correctamente.

### A.4 — [Reporte] Lotes - Stock

**Estado:** implementado (2026-08-04). Ruta `/dashboard/reportes/lotes-stock`, menú
"Reportes → Lotes - Stock", carpeta `src/app/features/reports/stock-report/`
(`StockReportDashboard`). El widget B.2 (Home view: Lotes en bajo stock) sigue **no
implementado** — esta corrida solo cubrió A.4 — pero la decisión de esquema de abajo ya queda
resuelta para cuando se implemente B.2 (reutilizar `batches.min_stock`, mismo fallback de 10).

**Definición:** reporte de inventario que lista lotes ACTIVOS con su stock **disponible**
(`batch_available_stock`, no `batches.stock` crudo), filtrable por almacén/categoría/marca/
industria, con un toggle "Solo stock bajo" y ordenado por stock disponible ascendente (los más
urgentes primero) para poner el foco en identificar lotes bajos o próximos a agotarse.

**Finalidad:** control de inventario — decidir qué reponer y cuándo.

**Datos/entidades:** `batches` (join a `products.name` + `product_categories.name` vía
`products.category_id`, `brands.name`, `industries.name`, `warehouses.name`) + vista
`batch_available_stock` (`SPBatch.getAvailableStock()`) para el stock real. El join a
categoría no existía en `SPBatch.get()` — se agregó (`product:products(name,
category:product_categories(id,name))`), junto con `brand:brands(name)` que tampoco estaba.
Ambos joins son adiciones no rompientes (campos opcionales nuevos en el modelo `Batch`), el
resto de consumidores de `SPBatch.get()` (`batch-dashboard`, `tab-parts` de orden/cotización)
sigue funcionando igual.

**Decisión de esquema tomada (resuelve el "Riesgo de datos" original):** se agregó
`batches.min_stock NUMERIC` (nullable, **por lote**, no un umbral global en
`workshop_settings`) — distintos productos tienen niveles de reposición muy distintos (una
batería no se repone igual que un filtro de aceite), así que un umbral único por sistema no
serviría. `batch-table.html` y `batch-detail-modal.html` ya tenían un indicador visual de
"stock bajo" hardcodeado en `< 10` unidades (no documentado hasta ahora); se actualizaron para
usar `(stock ?? 0) < (min_stock ?? 10)` — el `10` queda como **fallback** cuando el lote no
tiene `min_stock` configurado, no se inventó un número nuevo. El campo se expuso en
`batch-form-modal` ("Stock Mínimo", opcional) para que sea editable — sin esto el reporte
nunca tendría datos reales que mostrar. Migración `migrate.sql` v27.

**Seed:** se agregó `min_stock` a los 6 lotes ya sembrados con una mezcla deliberada de casos
— 2 quedan en "stock bajo" por umbral explícito, 1 vía el fallback de 10 (sin `min_stock`), 3
saludables. El lote `AC-003` (Aceite sintético) es el caso más importante: su `stock` crudo
(30) luce saludable, pero su `available_stock` real (26, tras descontar la reserva `ACTIVE` de
la cotización `CT-0002`) cae bajo su umbral (30) — el escenario exacto que obliga a usar
`batch_available_stock` en vez de `batches.stock` a secas.

---

## B. Home view (widgets del Dashboard principal)

El `Dashboard` (`/dashboard`) hoy solo renderiza `<app-birthday-card />`
(`features/dashboard/components/birthday-card/`) — ver `[[features-navigation]]` §3. Estos dos
widgets son versiones resumidas/de alerta rápida de A.3 y A.4 respectivamente, pensadas para
verse de un vistazo al entrar al sistema, sin filtros ni navegación adicional.

### B.1 — [Reporte] Home view: Cumpleañeros del mes

**Estado:** implementado parcialmente — `BirthdayCard` (`birthday-card.ts/html/scss`).

**Definición actual:** tarjeta en el Dashboard que lista clientes (`SPCustomer.listen()`) cuyo
`birthdate` cae en el mes en curso, ordenados por día, con resaltado (`isTodayBirthday`) si el
cumpleaños es hoy mismo. Abre `CustomerDetailModal` al hacer clic en un cliente.

**Finalidad:** alerta visual inmediata al entrar al sistema, sin necesidad de ir a un reporte
filtrable — recordatorio rápido para saludar a clientes del mes.

**Gap conocido:** solo considera `customers`, no `mechanics` — aunque `Mechanic` también tiene
`birthdate` en su modelo, el widget no los incluye (confirmado, no es un descuido reciente).
Si se pide ampliarlo, es una extensión del componente existente (agregar una segunda fuente de
datos), no una implementación desde cero.

### B.2 — [Reporte] Home view: Lotes en bajo stock

**Estado:** implementado (2026-08-04). `LowStockCard`
(`src/app/features/dashboard/components/low-stock-card/low-stock-card.ts/html/scss`), montado
en `dashboard.html` **junto a** `<app-birthday-card />` (no la reemplaza) — mismo grid
responsive de `dashboard.scss` (`repeat(auto-fill, minmax(22rem, 1fr))`), así que ambas
tarjetas se acomodan una al lado de la otra automáticamente.

**Definición:** tarjeta en el Dashboard que lista, sin filtros, los lotes `ACTIVE` cuyo stock
**disponible** (`SPBatch.getAvailableStock()` / `batch_available_stock`, no `batches.stock` a
secas) está por debajo de su umbral — ordenados por disponible ascendente (más urgente
primero). Click en un lote abre `BatchDetailModal` (mismo modal que usa `batch-dashboard`).

**Finalidad:** misma lógica que B.1 pero para inventario — evitar enterarse de un quiebre de
stock solo cuando un cliente ya lo pidió.

**Datos/entidades:** mismos que A.4. **Sin cambio de esquema** — la decisión de umbral
(`batches.min_stock` por lote, nullable, fallback a 10 unidades cuando no está definido) ya se
tomó y quedó implementada al construir A.4 (ver esa sección); B.2 la reutiliza directamente
sin volver a decidirla, tal como este documento pedía. `LowStockCard` usa exactamente el mismo
criterio `(stock ?? 0) < (min_stock ?? 10)` que `batch-table.html`, `batch-detail-modal.html`
y el reporte A.4 — los cuatro lugares del sistema que muestran "stock bajo" están ahora
sincronizados en un solo criterio, sin números mágicos duplicados.

**Seed:** no se agregó nada nuevo — el seed de `min_stock` hecho en A.4 (2 lotes bajos por
umbral explícito, 1 por el fallback de 10, 3 saludables) ya le da a esta tarjeta datos no
triviales para mostrar de entrada.

**Capa de datos:** no se creó ningún método nuevo — reutiliza `SPBatch.listen()` y
`SPBatch.getAvailableStock()` ya existentes (mismos que usa A.4 y `tab-parts` de cotización),
filtrando y ordenando client-side en el propio componente, igual que `BirthdayCard` hace con
`SPCustomer.listen()`.

---

## C. Reportes extra (backlog, sin prioridad ni fecha asignada)

Reportes solicitados como ideas adicionales, no comprometidos en el plan original de
`features.md`. Se documentan igual (definición + finalidad) para que, si se decide
implementar alguno, ya exista el análisis de qué tabla/columna usar.

### C.1 — [Reporte] ¿Qué tipo de vehículo / marca / año entra más?

**Estado:** implementado (2026-08-04). Ruta `/dashboard/reportes/vehiculos-frecuentes`, menú
"Reportes → Vehículos Frecuentes", carpeta
`src/app/features/reports/vehicle-frequency-report/`
(`VehicleFrequencyReportDashboard`).

**Definición:** reporte estadístico que agrupa `vehicles` (vía `service_orders.vehicle_id`)
por `brand`, `model` **o** `year` — un selector "Agrupar por" (Marca/Modelo/Año, toggle
group) cambia la dimensión activa **instantáneamente sin volver a consultar** la base de
datos (es un recálculo puro sobre las filas ya cargadas) — contando frecuencia de órdenes de
servicio en un rango de fechas opcional (`started_date`, mismo filtro que A.1/A.2). Muestra
cantidad de órdenes y % del total por cada valor, ordenado descendente (ranking).

**Finalidad:** entender qué marcas/modelos/años de vehículo son más comunes en el taller —
insumo para decisiones de stock de repuestos compatibles (`batches.compatible_brands`/
`compatible_models`) y para especializar mecánicos en las marcas más frecuentes.

**Riesgo de datos — resuelto:** `vehicles.brand`, `.model` y `.year` son campos de texto libre
(no catálogo). Se implementó la normalización sugerida: la **clave de agrupación** usa
`value.trim().toLowerCase()` (`normalizeKey()` en el componente), y el **valor mostrado** se
recapitaliza con un `toTitleCase()` genérico (primera letra de cada palabra en mayúscula) para
que la tabla no muestre el texto crudo tal cual fue tecleado. El seed prueba este caso
explícitamente (ver abajo) — sin la normalización, "Toyota" y "TOYOTA" habrían quedado como 2
filas separadas en vez de sumar sus órdenes juntas.

**Cambio de esquema:** no se requirió — `brand`/`model`/`year` ya existían en `vehicles` como
texto libre, tal como anticipaba el riesgo de datos original.

**Seed:** se agregó un 5º vehículo (`vehicle 5`, Toyota Hilux 2018, con `brand = 'TOYOTA'` en
mayúsculas a propósito — mismo cliente que el vehículo 2) y 4 órdenes de servicio nuevas
(OS-0004 a OS-0007, cada una con una sola línea de mano de obra para mantener el total interno
consistente) repartidas así: 2 más para el vehículo 1 (Toyota Corolla), 1 para el vehículo 5
(TOYOTA Hilux) y 1 más para el vehículo 3 (Nissan Frontier). Resultado esperado agrupando por
marca (normalizada): Toyota = 4 órdenes (3 del vehículo 1 + 1 del vehículo 5, sumadas gracias a
la normalización), Nissan = 2, Suzuki = 1, Honda = 0 (sin órdenes, no aparece). Sin esto, las 3
órdenes originales del seed apuntaban cada una a un vehículo distinto — un ranking totalmente
trivial (todo empatado en 1).

**Capa de datos:** `SPServiceOrder.getVehicleFrequency()` — una sola query a `service_orders`
con `vehicle:vehicles(brand,model,year)` embebido y `.not('vehicle_id','is',null)`, filtrada
por `started_date`. Sin RPC ni `forkJoin` — mismo criterio de solo-lectura que el resto de
reportes de este módulo.

### C.2 — [Reporte] ¿Cuánto estoy ganando por productos?

**Estado:** implementado (2026-08-04), **sin ruta ni menú propios a propósito** — ver
resolución del solapamiento abajo. Vive como la pestaña **"Por Producto"** dentro de
`UtilityReportDashboard` (`/dashboard/reportes/utilidades`, misma ruta que A.1), junto a la
pestaña original ahora renombrada "Por Orden".

**Definición:** desglose de utilidad limitado a repuestos vendidos (`service_order_batches`):
ingreso (suma de `subtotal`) menos costo (`cost_at_sale`, con fallback a `batches.cost` para
líneas anteriores a esa columna — mismo criterio que A.1), agrupado por producto, con el mismo
filtro de fecha (`started_date`) que la pestaña "Por Orden".

**Resolución del solapamiento (era la nota explícita del documento original: "es un
recorte/drill-down de A.1, no un reporte independiente desde cero"):** se implementó
literalmente como eso — **no se creó una carpeta/ruta/menú nueva**. Además, en la capa de
datos C.2 resultó ser el mismo cálculo que ya hacía A.2 (`getProductSalesReport()`, agrupar
`service_order_batches` por producto) más costo/utilidad, así que en vez de escribir una
tercera query se **generalizó `SPServiceOrder.getProductSalesReport()`** (agregando
`cost_at_sale`/`batch.cost` al `select` y `cost`/`utility` a `ProductSalesReportRow`) y C.2
simplemente la reutiliza con los mismos filtros de fecha que ya tenía la pestaña "Por Orden".
`product-sales-report-dashboard` (A.2) no muestra las columnas nuevas — sigue enfocado en
movimiento (cantidad/ingreso), no rentabilidad.

**Riesgo de datos:** mismo problema de costo no histórico que A.1 — ya resuelto ahí
(`cost_at_sale`), reutilizado aquí sin volver a decidirlo.

**Cambio de esquema:** no se requirió — `cost_at_sale` ya existía desde A.1.

**Seed:** no se agregó nada nuevo — reutiliza exactamente los mismos datos sembrados para
A.1/A.2 (los mismos lotes con `cost_at_sale` variado ya dan un desglose por producto no
trivial).

### C.3 — [Reporte] Productos, servicios de mano de obra y extras

**Estado:** implementado (2026-08-04). Ruta `/dashboard/reportes/composicion-ingresos`, menú
"Reportes → Composición de Ingresos", carpeta
`src/app/features/reports/income-composition-report/`
(`IncomeCompositionReportDashboard`). A diferencia de C.2, este documento **no** traía una nota
de solapamiento con A.1 ni con ningún otro reporte, así que se implementó como página propia
(ruta + menú), siguiendo la convención por defecto — no se fusionó con Utilidades.

**Definición:** reporte comparativo de las 3 fuentes de ingreso — repuestos
(`service_order_batches`), mano de obra (`service_order_services`) y servicios externos
(`service_order_external_services`) — sumadas a través de **todas** las órdenes en un rango de
fechas opcional (`started_date`), mostrando el ingreso y el % que cada categoría aporta al
total, con una barra de proporción visual. Es un agregado a nivel de sistema (no por orden ni
por producto) — las otras 2 dimensiones ya las cubren A.1 (por orden) y A.2/C.2 (por producto).

**Finalidad:** entender la composición del negocio (¿se gana más por repuestos o por mano de
obra?) para decisiones estratégicas de precios (ej. subir tarifa de mano de obra vs. ajustar
margen de repuestos).

**Cambio de esquema:** no se requirió — `subtotal` ya existía en las 3 tablas pivote.

**Seed:** no se agregó nada nuevo — los datos ya sembrados (para A.1/A.2/C.1) ya cubren las 3
categorías con pesos bien distintos (mano de obra Bs. 630, repuestos Bs. 1080, externos
Bs. 150 — repuestos ~58%, mano de obra ~34%, externos ~8% del total de Bs. 1860), suficiente
para verificar que el reporte calcula proporciones reales y no un empate trivial.

**Capa de datos:** `SPServiceOrder.getIncomeComposition()` — un método nuevo (no había uno
hermano con esta forma de agregación de 3 fuentes a nivel de sistema). Una sola query a
`service_orders` con las 3 tablas pivote embebidas (`order_services`, `order_batches`,
`order_externals`, cada una trayendo solo `subtotal`), sumadas client-side. Sin RPC ni
`forkJoin`.

### C.4 — [Reporte] Servicios en Órdenes de Servicio Completadas o Pendientes por rango de fechas

**Estado:** implementado (2026-08-04). Ruta `/dashboard/reportes/servicios-por-estado`, menú
"Reportes → Servicios por Estado", carpeta
`src/app/features/reports/service-lines-report/` (`ServiceLinesReportDashboard`). Sin
solapamiento con otro reporte del documento — es el único que lista **líneas** de mano de obra
sin agregar, filtradas por estado de orden.

**Definición:** listado plano (una fila por línea, sin agregar) de mano de obra
(`service_order_services`) filtrado por el estado de su orden (`service_orders.state`:
`COMPLETED` = completadas, `IN_PROGRESS` = pendientes — toggle de 3 opciones: Completadas /
Pendientes / Ambas, default Ambas) y por rango de fechas opcional sobre `started_date`. **Nunca
incluye órdenes `CANCELED`** — ese tercer estado está fuera del alcance de la definición
original ("no existe un estado PENDING separado"), ni siquiera con el toggle en "Ambas".
Columnas: fecha, orden, estado (chip), servicio, cantidad, cliente, vehículo, mecánico — sin
precio/subtotal, es seguimiento operativo, no financiero.

**Finalidad:** seguimiento operativo (no financiero) de qué servicios se prestaron o siguen
pendientes en un periodo — útil para planificación de carga de trabajo, no solo para
contabilidad.

**Cambio de esquema:** no se requirió.

**Seed:** se agregó **OS-0008**, una orden `CANCELED` con una línea de mano de obra, para
probar explícitamente que el reporte la excluye en las 3 posiciones del toggle (incluida
"Ambas" — que solo significa COMPLETED+IN_PROGRESS, no "todos los estados"). Las 7 órdenes ya
sembradas para A.1/C.1/C.3 ya cubrían ambos estados en scope (4 `COMPLETED`, 3
`IN_PROGRESS`) con mecánicos y servicios variados, así que no hizo falta agregar más allá de
OS-0008.

**Capa de datos:** `SPServiceOrder.getServiceLinesReport()` — método nuevo, anclado en
`service_order_services` con join `!inner` a `service_orders` (para filtrar por `state` y
`started_date`) y a `services`/`customers`/`vehicles`/`mechanics` para los datos a mostrar. Sin
agregación — cada fila del resultado es una línea real de la tabla, ordenada por fecha
descendente en el cliente.

### C.5 — [Reporte] Por servicio, qué servicios son los más requeridos

**Estado:** implementado (2026-08-04). Ruta `/dashboard/reportes/servicios-mas-requeridos`,
menú "Reportes → Servicios Más Requeridos", carpeta
`src/app/features/reports/service-frequency-report/`
(`ServiceFrequencyReportDashboard`). Sin solapamiento con otro reporte de este documento.

**Definición:** ranking de `services` (catálogo) por frecuencia de uso en
`service_order_services` (cantidad total realizada) e ingreso generado, en un rango de fechas
opcional, ordenado por cantidad descendente. Sin filtro de estado de orden — mismo criterio ya
usado en A.2/C.1/C.3 (ninguno excluye órdenes `CANCELED`, solo filtran por fecha); se mantuvo
por consistencia entre reportes hermanos, no por descuido.

**Finalidad:** identificar los servicios más demandados — insumo para pricing, promociones, o
priorizar capacitación de mecánicos en esos servicios específicos.

**Cambio de esquema:** no se requirió.

**Seed:** no se agregó nada nuevo — las 9 líneas de mano de obra ya sembradas (para A.1/C.1/
C.3/C.4) ya dan un ranking no trivial: "Cambio de aceite" = 3, "Revisión de frenos" = 2,
"Diagnóstico eléctrico" = 2 (incluye la línea de la orden `CANCELED` OS-0008, ver nota de
criterio arriba), "Cambio de batería" = 1, "Alineación y balanceo" = 1.

**Capa de datos:** `SPServiceOrder.getServiceFrequencyReport()` — método nuevo (mismo patrón
que `getProductSalesReport`/A.2, pero sobre `service_order_services` en vez de
`service_order_batches`; no se reusó el mismo método porque son tablas distintas, pero sigue
la misma forma de query/agrupación). Una sola query con join `!inner` a `service_orders` para
el filtro de fecha, agrupada por servicio en el cliente.

### C.6 — [Reporte] Reporte por productos/lote: qué lotes se venden más por producto

**Estado:** resuelto — **implementado indirectamente por A.2**, no como reporte separado. Esta
resolución ya se tomó y documentó al implementar A.2 (ver esa sección, "Resolución de la nota
de solapamiento (C.6)"): `SPServiceOrder.getProductSalesReport()` ordena sus filas por
cantidad vendida **descendente** por defecto, así que la misma tabla de A.2
(`/dashboard/reportes/productos-lotes`) ya sirve como el ranking/top que pedía C.6. No se creó
ruta, menú, ni método nuevo para C.6 — sería una fuente de datos idéntica a A.2.

**Definición:** ranking (top N) de `batches`/`products` por cantidad vendida, sumando
`service_order_batches.quantity` agrupado por producto, en un rango de fechas.

**Finalidad:** saber qué productos rotan más rápido — insumo directo para decidir qué reponer
primero. Ver nota de solapamiento en A.2: si A.2 ya existe como listado general, este reporte
es su vista de "ranking/top", no una fuente de datos distinta.

### C.7 — [Reporte] Servicios hechos por técnico

**Estado:** implementado (2026-08-04). Ruta `/dashboard/reportes/servicios-por-tecnico`, menú
"Reportes → Servicios por Técnico", carpeta
`src/app/features/reports/mechanic-workload-report/`
(`MechanicWorkloadReportDashboard`). La limitación de modelo de abajo **no bloqueó la
implementación** — el documento ya aclaraba que no era un bug, solo una característica
aceptada del modelo actual; se implementó tal cual con atribución a nivel de orden completa,
y se avisa al usuario con un ícono de info junto al título (mismo texto que esta nota).

**Definición:** reporte que agrupa el trabajo realizado por mecánico en un rango de fechas
opcional, mostrando por mecánico: órdenes atendidas (distintas), servicios realizados (suma de
`quantity`) e ingreso generado (suma de `subtotal`). Ordenado por servicios realizados
descendente. Sin filtro de estado de orden — mismo criterio que A.2/C.1/C.3/C.5.

**Finalidad:** medir productividad/carga de trabajo por mecánico — insumo para evaluación de
desempeño o reparto de comisiones.

**⚠️ Limitación de modelo de datos (ya existía, se implementó respetándola, no se resolvió):**
desde la migración v15 (`service-order-single-mechanic`), `mechanic_id` vive en
`service_orders` (un mecánico por **orden completa**), no en `service_order_services` (un
mecánico por **línea**). Esto significa que este reporte solo puede atribuir trabajo a nivel
de orden completa: si una orden tiene 3 líneas de mano de obra distintas, las 3 se atribuyen al
único mecánico de esa orden, aunque en la realidad pudieran haberlas hecho personas distintas.
No es un bug del reporte — es una limitación del modelo actual (`[[service-order-flow]]`,
regla de negocio #3). Si se necesita atribución por línea, habría que reintroducir
`mechanic_id` en `service_order_services` (cambio de esquema mayor, ya descartado una vez —
coordinar con `[[service-order-flow]]` antes de revivirlo).

**Cambio de esquema:** no se requirió — se implementó respetando la limitación de arriba, no
resolviéndola (habría sido el cambio de esquema mayor ya descartado).

**Seed:** no se agregó nada nuevo — las 7 órdenes con mano de obra ya sembradas reparten sus
líneas entre los 3 mecánicos (Roberto: OS-0001, OS-0005, OS-0007 → 3 órdenes/3 servicios; Luis:
OS-0002 [2 líneas], OS-0004 [1 línea, y también la orden `CANCELED` OS-0008] → 3 órdenes/4
servicios; Fernando: OS-0003, OS-0006 → 2 órdenes/2 servicios), suficiente para un ranking no
trivial.

**Capa de datos:** `SPServiceOrder.getMechanicWorkloadReport()` — método nuevo, mismo patrón
que `getServiceFrequencyReport`/C.5 pero agrupando por `service_order.mechanic_id` (join
anidado a 2 niveles: `service_order_services → service_orders → mechanics`) en vez de por
`service_id`. Cuenta órdenes distintas con un `Set` de ids además de sumar `quantity`.

### C.8 — [Reporte] Órdenes de servicio y fecha de retorno

**Definición:** listado de `service_orders` con `return_date` no nulo, próximas a vencer o ya
vencidas, junto con datos de contacto del cliente (`customers.phone`) para seguimiento.

**Finalidad:** permitir al taller hacer seguimiento proactivo (llamada/mensaje) a clientes cuya
fecha de retorno sugerida se acerca o ya pasó — típicamente para mantenimiento preventivo o
revisión post-servicio.

**Nota:** `service_orders.return_date` ya existe en el esquema (`DATE`, nullable) pero hoy
**ningún componente lo consume** — ni el dashboard, ni el detalle, ni ningún reporte. Este
sería el primer uso real de ese campo.

---

## Checklist antes de implementar cualquier reporte de este documento

1. Verificar en `[[features-navigation]]` §3/§5 que el reporte no exista ya con otro nombre
   (Ingresos/Egresos son el ejemplo de esto).
2. Elegir la convención de carpeta/ruta/menú descrita al inicio de este documento — dominio
   `reports`, no reutilizar `accounting/`.
3. Si el reporte necesita "stock disponible", usar `batch_available_stock` /
   `SPBatch.getAvailableStock()`, nunca `batches.stock` a secas (A.4, B.2, C.6).
4. Si el reporte necesita costo histórico de una venta (A.1, C.2), decidir primero si
   `batches.cost` actual es aceptable o si hace falta congelar el costo en la línea — no
   asumir que el costo actual siempre fue el costo de venta.
5. Si el reporte agrupa por mecánico a nivel de línea de servicio (C.7), recordar que el
   modelo actual no lo permite — el mecánico es por orden completa.
6. Seguir el patrón de spec de `.claude/commands/income-report.md`/`expense-report.md` al
   escribir el comando de implementación: reporte de solo lectura, filtros por formulario con
   botón "Buscar" (no reactivo en cada tecla), tabla `mat-table` sin paginación salvo que el
   volumen lo justifique.
