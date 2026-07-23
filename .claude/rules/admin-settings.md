# Configuración del sistema (Admin → Configuración)

Regla de referencia para el módulo **Configuración** del grupo **Admin** — implementado como
entidad singleton (2026-07-23), siguiendo la especificación original de este mismo documento.
A diferencia del resto de módulos "Admin" (`[[quotes-service-orders]]`,
`[[service-order-flow]]`), no tiene dashboard/listado: es un único formulario de
carga+guardado. `[[features-navigation]]` debe actualizarse para reflejar que "Admin" ya no
tiene un solo ítem — ver §8.

Documentos relacionados:
- `.claude/docs/entities.md` — entidad `WorkshopSettings` (tabla `workshop_settings`)
  documentada en el módulo Admin, junto a `User`.
- `.claude/commands/create-crud.md` — patrón CRUD base. **No se siguió tal cual** para este
  módulo (ver §3) — sin dashboard, tabla, ni modal de eliminar.

---

## 1. Qué resuelve este módulo

Es una pantalla de **configuración global del taller** (datos de la empresa, contacto, redes
sociales, logo y correlativo de órdenes) que alimenta los documentos imprimibles (Hoja de
Servicios, Cotización). Antes de esta implementación, esos datos estaban hardcodeados y
duplicados en `service-order-print-modal.html` y `quote-print-modal.html`; ambos ahora leen
de `SPWorkshopSettings` (ver §6) — no queda ningún hardcode de nombre/logo/eslogan/contacto en
esos dos archivos.

## 2. Campos del formulario (mockup de referencia)

| Campo UI | Tipo | Notas |
|---|---|---|
| Nombre | texto, requerido | Nombre del taller (hoy hardcodeado como "MECATRÓNICA") |
| Eslogan | texto | Hoy hardcodeado en los 2 print modals |
| Correo | email | Sin uso actual en impresión — nuevo |
| Dirección | texto largo | Sin uso actual en impresión — nuevo |
| Num. de Contacto 1 | texto/teléfono, requerido | |
| Num. de Contacto 2 | texto/teléfono, opcional | |
| Facebook | URL, opcional | |
| Instagram | URL, opcional | |
| Sitio Web | URL, opcional | |
| Tik tok | URL, opcional | |
| URL extra (x2) | URL, opcional, 2 campos libres | Placeholder del mockup dice "Enlace instagram" en ambos — es un descuido del mockup, son campos genéricos de enlace, no otros 2 Instagram |
| Nro. de orden de servicio | numérico | Ver §7 — correlativo para `service_orders.number` |
| Logo actual / Logo (upload) | archivo PNG, máx. 10MB | Ver §5 — primer upload real de archivo del proyecto |
| Mostrar en impresión | boolean (Sí/No) | Controla si el bloque de datos de empresa aparece en los documentos impresos |

## 3. Por qué NO sigue el patrón de `create-crud.md`

`create-crud.md` asume un CRUD de **listado múltiple** (dashboard + tabla + modal
crear/editar + modal ver + modal eliminar). Esta entidad es un **singleton** (una sola fila
para todo el sistema), así que:

- **No hay dashboard ni tabla.** Es un único formulario que carga el registro existente al
  entrar y lo actualiza al guardar (`get()` + `update()`, sin listado).
- **No hay botón "agregar nuevo registro".** La fila única existe siempre (creada por
  migración/seed, o creada automáticamente por el servicio si no existe — decidir cuál al
  implementar, pero no exponer un botón "crear" en la UI).
- **No hay modal "ver detalle" ni modal "eliminar".** El propio formulario es la única
  vista/edición; no se puede borrar la configuración del sistema.
- Si se sigue usando `create-crud.md` como referencia, el paso 6 del comando (dashboard/tabla/
  modales) debe reemplazarse por "un componente de formulario único con carga/guardado del
  registro singleton". El resto del comando (ubicación de carpeta, servicio `sb-*`, ruta lazy,
  entrada de menú, modelos en `core/models/`, convenciones EN/ES) sí aplica igual.

## 4. Esquema de datos (implementado)

Tabla `workshop_settings`, creada en `src/docs/database/tables.sql` (insertada justo después
del seed de `users`, antes de `product_categories`) y replicada como migración `v23` en
`src/docs/database/migrate.sql`. El singleton se garantiza con una columna boolean `singleton`
con `UNIQUE` + `CHECK (singleton)` — nunca puede existir una segunda fila:

```sql
CREATE TABLE IF NOT EXISTS workshop_settings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton         BOOLEAN     NOT NULL DEFAULT true,
  name              TEXT        NOT NULL,
  slogan            TEXT,
  email             TEXT,
  address           TEXT,
  contact_phone_1   TEXT,
  contact_phone_2   TEXT,
  facebook_url      TEXT,
  instagram_url     TEXT,
  website_url       TEXT,
  tiktok_url        TEXT,
  extra_url_1       TEXT,
  extra_url_2       TEXT,
  next_order_number INTEGER,
  logo_url          TEXT,
  show_in_print     BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workshop_settings_singleton_unique UNIQUE (singleton),
  CONSTRAINT workshop_settings_singleton_true CHECK (singleton)
);
```

Sembrada con una fila única (datos reales del taller, tomados del mockup original). En
`tables.sql` el trigger `set_updated_at`, el `ENABLE ROW LEVEL SECURITY`, las políticas
`FOR ALL` (authenticated + anon) y la publicación realtime de `workshop_settings` **no** se
declaran inline junto a la tabla — se agregan a las secciones centralizadas al final del
archivo (mismo patrón que todas las tablas de `tables.sql`; solo `migrate.sql` usa bloques
autocontenidos por ser un log cronológico). Si tocas esta tabla en `tables.sql`, respeta esa
separación o el trigger fallará (`set_updated_at()` se define al final del archivo).

Modelo TS: `src/app/core/models/workshop-settings.model.ts` (interfaz `WorkshopSettings`).
Documentada en `.claude/docs/entities.md` bajo el módulo Admin, junto a `User`.

## 5. Logo — primer upload real de archivo del proyecto

Implementado contra **Supabase Storage real** (no simulado) — bucket `workshop-logo`, público
para lectura (`public: true` + policy `public_read_workshop_logo` en `storage.objects`),
escritura permitida a `anon`+`authenticated` (mismo criterio permisivo que el resto de RLS del
proyecto, sin roles todavía). Bucket y policies se crean en `tables.sql`/`migrate.sql` junto a
la tabla (`INSERT INTO storage.buckets ...` + `CREATE POLICY ... ON storage.objects`).

`SPWorkshopSettings.uploadLogo(file)` (`src/app/core/services/supabase/sb-workshop-settings.ts`)
sube el archivo con un nombre único (`logo-<timestamp>.<ext>`) y `upsert: true`, y retorna la
URL pública vía `getPublicUrl()`. `settings-form.ts` la usa antes de llamar `update()`,
encadenando con `switchMap` (`logo$.pipe(switchMap(logoUrl => service.update(...)))`) — si no
se seleccionó un archivo nuevo, reusa el `logo_url` ya cargado.

No se extrajo un componente compartido de upload (`shared/components/file-upload/`) — la
lógica vive directo en `settings-form.ts` porque sigue siendo el único lugar del proyecto que
sube archivos. Si un segundo módulo necesita subir archivos, extraer ese componente entonces
(YAGNI: no se creó una abstracción para un solo caso de uso).

## 6. Consumo en impresión — hardcode eliminado

`service-order-print-modal.ts/html` y `quote-print-modal.ts/html` inyectan
`SPWorkshopSettings`, cargan `settings = signal<WorkshopSettings | null>(null)` en `ngOnInit`
(en paralelo a `getWithLines`, sin bloquear el `loading()` del detalle) y consumen:

- `settings()?.name` → reemplaza el nombre hardcodeado "MECATRÓNICA" en título/logo.
- `settings()?.slogan` → reemplaza el eslogan hardcodeado; el bloque solo se imprime si
  `slogan` no es null.
- `settings()?.logo_url` → si existe, renderiza `<img class="logo-image">` dentro de
  `.logo-icon`; si no, cae al fallback de letra inicial (`{{ (settings()?.name ?? 'M').charAt(0) }}`).
- `settings()?.contact_phone_1/2` y `settings()?.address` → en `quote-print-modal` reemplazan
  el teléfono/dirección hardcodeados de `.doc-footer-info` (`service-order-print-modal` no
  imprimía estos campos y sigue sin hacerlo — no se agregó contenido nuevo ahí).
- `show_in_print`: todo el bloque de datos de empresa (logo + nombre + eslogan) se envuelve en
  `@if (!settings() || settings()?.show_in_print)` — el `!settings()` es para no ocultar el
  bloque mientras la config todavía está cargando (fetch en paralelo, llega en general antes
  del `onPrint()` real del usuario).

Si agregas un campo nuevo a `WorkshopSettings` que también deba imprimirse, actualiza **ambos**
componentes — siguen sin compartir un componente común (se evaluó extraer
`workshop-print-header` a `shared/components/` pero no se hizo: los dos documentos tienen
layouts de encabezado suficientemente distintos — ver clases `.company-logo`/`.logo-cell` en
service-order vs `.doc-logo`/`.doc-footer-info` en quote — que una abstracción prematura
hubiera forzado props condicionales en vez de simplificar).

## 7. "Nro. de orden de servicio" — guardado, NO wireado a `service-order-form`

`next_order_number` se guarda y edita en el formulario de Configuración
(`settings-form.ts`/`.html`, campo "Nro. de orden de servicio"), pero **esta implementación NO
modificó `service-order-form.ts`**: `service_orders.number` sigue siendo 100% texto libre
manual (`FormControl<string>('')`), sin precarga del correlativo ni auto-incremento. Es decir,
`[[service-order-flow]]` sigue siendo el documento correcto para ese comportamiento — no
asumas que crear una orden hoy sugiere el valor de `next_order_number`.

Si en el futuro se conecta este campo al flujo de creación de órdenes:
- Precargar `summaryForm.number` con `next_order_number` en `ngOnInit()` de
  `service-order-form.ts` (modo creación), dejándolo editable.
- Decidir si el incremento (`next_order_number + 1`) ocurre al guardar la orden (RPC) o
  manualmente desde Configuración — no hay una RPC para esto todavía.
- Actualizar `[[service-order-flow]]` con el nuevo comportamiento cuando se implemente.

## 8. Ruta, menú y componente (implementado)

- **Carpeta:** `src/app/features/admin/settings/` — `settings-form.ts/.html/.scss` (sin
  subcarpeta `components/`, no hay modales propios de este módulo).
- **Ruta:** `app.routes.ts`, bajo `admin/usuarios`:
  ```ts
  {
    path: 'admin/configuracion',
    loadComponent: () => import('./features/admin/settings/settings-form').then(m => m.SettingsForm),
  },
  ```
- **Menú:** `nav-menu.ts`, grupo `Admin` (ahora con 2 items):
  ```ts
  { label: 'Configuración', icon: 'settings', route: '/dashboard/admin/configuracion' },
  ```
  → `[[features-navigation]]` §2 (tabla "Admin | Usuarios | ... | Único item") queda
  desactualizado por este cambio; debe editarse para reflejar el segundo ítem.
- El formulario no abre ningún modal (`DialogFrame`) — es una página completa con
  `page-header` + `form-layout` (panel principal de datos + panel lateral de logo/toggle),
  mismo esqueleto visual que `quote-form.html` pero sin tabs ni tablas.

## 9. Estado real / pendientes conocidos

1. Upload de logo: **resuelto** — Supabase Storage real, bucket `workshop-logo` (§5).
2. `next_order_number`: **guardado pero no conectado** a `service-order-form` (§7) — sigue
   pendiente si se quiere el auto-incremento real.
3. `service-order-print-modal` y `quote-print-modal`: **ambos actualizados** (§6) — ya no
   tienen nombre/logo/eslogan hardcodeado.
4. Entidad documentada en `.claude/docs/entities.md` (Admin Module, junto a `User`).
5. `[[features-navigation]]` **pendiente de editar** — su tabla todavía dice que Admin tiene
   "Único item" (Usuarios); actualízala al tocar ese documento.
