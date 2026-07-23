# Features y Navegación — mapa real vs. plan

Regla de referencia para el árbol de módulos/menú del sistema. Generada analizando el
código real (`app.routes.ts`, `nav-menu.ts`, `src/app/features/`) contra
`.claude/docs/features.md` — ese archivo es el **plan original de menú**, no el estado
actual: varios grupos, nombres y sub-items ya no coinciden con lo implementado. Úsalo como
inspiración de dirección de producto, pero para saber qué existe hoy y cómo está cableado,
usa este documento.

Documentos relacionados:
- `.claude/docs/features.md` — árbol de menú planificado (aspiracional, desactualizado en detalles).
- `.claude/docs/entities.md` — esquema de entidades.
- `.claude/commands/create-crud.md` — patrón base de CRUD (dashboard/tabla/modal) que sigue casi todo módulo listado abajo.
- `[[quotes-service-orders]]`, `[[service-order-flow]]`, `[[admin-settings]]` y `[[bank-manual-movements]]` — detalle profundo de esos módulos, no lo repitas aquí.

---

## 1. Cómo está armado el menú

`nav-menu.ts` (`src/app/shared/components/nav-menu/nav-menu.ts`) define un array estático
`modules: NavModule[]` (`{ title, icon, items: { label, icon, route }[] }`), renderizado en
`nav-menu.html` como acordeón (`MatExpansionModule`). **No hay guard por rol** todavía — todos
los grupos son visibles a cualquier usuario autenticado.

Todas las rutas reales viven bajo `path: 'dashboard'` (`AdminLayout`, `canActivate:
[authGuard]`) en `app.routes.ts`, con `loadComponent` (lazy) salvo el propio `Dashboard`
(eager). No hay un módulo de rutas separado por feature — todo se declara en el mismo
`app.routes.ts` plano.

## 2. Mapa real: grupo de menú → rutas → carpeta de feature

| Grupo en `nav-menu.ts` | Item | Ruta | Carpeta (`src/app/features/`) | Notas |
|---|---|---|---|---|
| **Admin** | Usuarios | `/dashboard/admin/usuarios` | `admin/users/` | CRUD estándar (dashboard + tabla + modales). |
| | Configuración | `/dashboard/admin/configuracion` | `admin/settings/` | Entidad singleton (una sola fila, tabla `workshop_settings`) — sin dashboard/tabla/modal de eliminar, un único formulario (`settings-form.ts`). Alimenta los datos de empresa de `service-order-print-modal` y `quote-print-modal`. Ver `[[admin-settings]]`. |
| **Inventario** | Categorías | `/dashboard/inventario/categorias` | `inventory/product-category/` | |
| | Presentaciones | `/dashboard/inventario/presentaciones` | `inventory/product-presentation/` | |
| | Productos | `/dashboard/inventario/productos` | `inventory/product/` | |
| | Almacenes | `/dashboard/inventario/almacenes` | `inventory/warehouses/` | |
| | Marcas | `/dashboard/inventario/marcas` | `inventory/brand/` | |
| | Industrias | `/dashboard/inventario/industrias` | `inventory/industry/` | |
| | Proveedores | `/dashboard/compras/proveedores` ⚠️ | `inventory/supplier/` | Prefijo de ruta `compras/` no `inventario/` — inconsistencia histórica, no la repitas al agregar módulos nuevos (ver §4). |
| | Lotes | `/dashboard/inventario/lotes` | `inventory/batches/` | |
| **Cuentas** (features.md lo llama "Contabilidad") | Cuentas Bancarias | `/dashboard/cuentas/cuentas-bancarias` | `accounting/bank-accounts/` | |
| | Tipos de Transacción | `/dashboard/cuentas/tipos-transaccion` | `accounting/bank-transaction-types/` | |
| | Ingresos | `/dashboard/cuentas/ingresos` | `accounting/income-report/` | Es un reporte (filtra `bank_account_histories` tipo INCOME, incluye TODOS los ingresos: manuales y automáticos), no un CRUD — ver `.claude/commands/income-report.md`. |
| | Registrar Ingreso | `/dashboard/cuentas/registro-ingresos` | `accounting/income-register/` | CRUD de ingresos **manuales** (depósitos u otro tipo INCOME no reservado) — complementa al reporte de arriba, no lo reemplaza. Ver `[[bank-manual-movements]]`. |
| | Egresos | `/dashboard/cuentas/egresos` | `accounting/expense-report/` | Idem Ingresos (reporte), tipo EXPENSE — ver `.claude/commands/expense-report.md`. |
| | Registrar Egreso | `/dashboard/cuentas/registro-egresos` | `accounting/expense-register/` | CRUD de egresos **manuales** (retiros u otro tipo EXPENSE no reservado) — módulo gemelo de "Registrar Ingreso". Ver `[[bank-manual-movements]]`. |
| **Taller** | Clientes | `/dashboard/taller/clientes` | `workshop/customers/` | |
| | Mecánicos | `/dashboard/taller/mecanicos` | `workshop/mechanics/` | |
| | Servicios | `/dashboard/taller/servicios` | `workshop/services/` | |
| | Servicios Externos | `/dashboard/taller/servicios-externos` | `workshop/external-services/` | |
| | Vehículos | `/dashboard/inventario/vehiculos` ⚠️ | `workshop/vehicles/` | Agrupado en menú bajo "Taller" pero con prefijo de ruta `inventario/` y carpeta bajo `workshop/` — tres convenciones distintas para el mismo módulo. No lo tomes como plantilla. |
| **Cotizaciones** | Cotizaciones | `/dashboard/cotizaciones/activas` | `quote/` | Rutas reales también incluyen `cotizaciones/nueva` y `cotizaciones/editar/:id` (formulario), sin entrada propia de menú — se navega ahí desde el dashboard. La pestaña "Anuladas" (`REJECTED\|EXPIRED\|CANCELED`) vive **dentro** de `quote-dashboard` (tab), no como segundo item de menú, aunque `features.md` lo dibuja como sub-item separado. Ver [[quotes-service-orders]]. |
| **Órdenes de Servicio** | En Curso | `/dashboard/ordenes/en-curso` | `service-order/` | Rutas reales también incluyen `ordenes/nueva` y `ordenes/editar/:id`, sin entrada de menú. `features.md` planifica sub-items "Completados"/"Canceladas" — **no existen**: el dashboard lista TODAS las órdenes (`SPServiceOrder.listen()`) sin filtro de tab por estado; el estado se ve como chip por fila. Ver [[service-order-flow]]. |
| **Auditoría y Reportes** | *(ninguno)* | — | — | Grupo declarado con `items: []` — placeholder visual, sin ruta ni feature. Todo lo que `features.md` planifica bajo "Reportes" (Utilidades, Productos, Cumpleañeros, Stock, Servicios por técnico) **no está implementado**, excepto Ingresos/Egresos que terminaron viviendo dentro de "Cuentas" (arriba), no aquí. |

## 3. Lo que existe en código pero no aparece en ningún menú

- **`/auth/login`** (`AuthLayout`, `canActivate: [publicGuard]`) — punto de entrada público, no aplica a este mapa de menú interno.
- **`features/auth/register/`** — el componente `Register` existe (`register.ts/.html/.sass`) pero **no tiene ruta registrada** en `app.routes.ts`. Es código muerto/pendiente; no asumas que `/auth/register` funciona.
- **`Dashboard`** (`/dashboard`, ruta raíz del layout) — hoy solo renderiza `<app-birthday-card />` (próximos cumpleaños de **clientes**, filtra `customers` por mes/día de `birthdate`; no incluye mecánicos pese a que estos también tienen `birthdate` en su modelo). El diseño original en `CLAUDE.md` ("stats cards, tabla de actividad reciente, gráfico de trazabilidad") **no está implementado** — no lo des por hecho al referenciar "el dashboard".
- **Formularios de creación/edición** de `quote` y `service-order` (`.../nueva`, `.../editar/:id`) no tienen entrada de menú propia — se llega por botón desde el dashboard respectivo. Es el patrón esperado, no una omisión.

## 4. Convención para agregar un módulo nuevo

Sigue el patrón mayoritario (Inventario/Taller/Cuentas), **no** las excepciones de §2:

1. **Carpeta:** `src/app/features/<dominio>/<modulo>/` (ej. `inventory/brand/`,
   `workshop/mechanics/`) — CRUD estándar: `<modulo>-dashboard/` (listado + tabla + búsqueda),
   `components/<modulo>-form-modal/`, `components/<modulo>-detail-modal/`. Sigue
   `.claude/commands/create-crud.md`.
2. **Ruta:** agrégala en `app.routes.ts` dentro de los `children` de `path: 'dashboard'`, con
   `loadComponent` (lazy) y el prefijo que coincida con el **dominio real** del módulo
   (`inventario/`, `taller/`, `cuentas/`, `admin/`) — no inventes un prefijo nuevo tipo
   `compras/` salvo que el grupo de menú también se llame así.
3. **Menú:** agrega el item en el array `modules` de `nav-menu.ts`, dentro del grupo que
   corresponda (o crea un grupo nuevo `{ title, icon, items: [] }` si es un dominio nuevo,
   como ya existe vacío "Auditoría y Reportes" esperando contenido).
4. **Modales:** si el módulo abre modales con `DialogFrame`, sigue el patrón de apertura
   documentado en [[service-order-flow]] §"Patrón de apertura de modales" (`hasBackdrop:
   false`, `panelClass: 'floating-dialog-panel'`, sin `width` explícito).
5. **Reglas del proyecto:** standalone components, signals para estado local, Angular
   Material por componente (no barrel imports), sin llamadas HTTP directas fuera de los
   servicios `SPXxx` en `core/services/supabase/` — ver `CLAUDE.md` para las convenciones
   generales de código/estilos.

## 5. Al tocar `features.md`

Si vas a planificar un módulo nuevo del árbol "Reportes" (Utilidades, Stock, Cumpleañeros,
Servicios por técnico) o "Configuración" de Admin, **antes de implementarlo** verifica en este
documento (§3) que efectivamente no existe ya con otro nombre — Ingresos/Egresos ya cubren
parte de lo planificado bajo "Contabilidad"/"Reportes" con nombres distintos
(`income-report`/`expense-report`), así que un reporte nuevo debería seguir ese mismo patrón
de carpeta (`accounting/<algo>-report/`) en vez de crear un dominio "Reportes" separado, salvo
que el usuario pida explícitamente esa reorganización.
