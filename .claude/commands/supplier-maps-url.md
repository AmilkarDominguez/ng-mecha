Agrega el campo URL de Google Maps al módulo de Proveedores

Utiliza un razonamiento: adaptive thinking

## Contexto
La entidad `Supplier` en `suppliers` necesita un nuevo campo `maps_url` que almacene la URL de ubicación del proveedor en Google Maps.
El campo es opcional. El flujo esperado es:
1. El operador abre Google Maps desde un botón auxiliar, ubica al proveedor y copia la URL.
2. Pega la URL en el campo del formulario.
3. Desde la tabla y el detalle puede abrir la ubicación directamente.

## Pasos

1. **Actualiza `entities.md`**
   - En `.claude/docs/entities.md`, agrega el campo `maps_url | String | nullable` a la tabla `suppliers`.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/supplier.model.ts`, agrega `maps_url?: string | null` a la interfaz `Supplier`.

3. **Actualiza el formulario de proveedor**
   - En `src/app/features/inventory/supplier/components/supplier-form-modal/`, agrega el campo `maps_url` con su `FormControl<string | null>` al `FormGroup` existente.
   - En el template, coloca el campo con un `MatFormField` (`matInput` de tipo `text`) con label "URL Google Maps".
   - El campo es opcional. Si tiene valor, aplica un validador `Validators.pattern(/^https?:\/\/.+/)` para verificar que sea una URL válida.
   - **Botón auxiliar "Abrir Google Maps"**: justo debajo o al lado del campo, agrega un elemento `<a>` con el atributo `href="https://maps.google.com"`, `target="_blank"` y `rel="noopener noreferrer"`, estilizado como `mat-stroked-button` de Angular Material con ícono `location_on`. El texto del botón: "Abrir Google Maps para obtener URL".
   - El propósito de este botón es que el usuario pueda buscar la ubicación en Google Maps, copiarla de la barra del navegador y pegarla en el campo.

4. **Actualiza la tabla de proveedores**
   - En `src/app/features/inventory/supplier/components/supplier-table/supplier-table.ts`:
     - Agrega un output `openMap = output<Supplier>()`.
     - En `displayedColumns`, el orden queda: `['name', 'phone', 'email', 'address', 'state', 'actions']` (sin cambios de columnas).
   - En el template `supplier-table.html`, dentro de la columna `actions`, agrega un `mat-icon-button` con ícono `location_on` y tooltip "Ver en Google Maps".
     - Este botón solo se habilita si `element.maps_url` tiene valor: `[disabled]="!element.maps_url"`.
     - Al hacer clic emite `openMap.emit(element)`.
   - En `src/app/features/inventory/supplier/supplier-dashboard.ts`, escucha el output `(openMap)` de la tabla y abre la URL en nueva pestaña:
     ```ts
     onOpenMap(supplier: Supplier): void {
       if (supplier.maps_url) window.open(supplier.maps_url, '_blank', 'noopener,noreferrer');
     }
     ```

5. **Actualiza el modal de detalles del proveedor**
   - En `src/app/features/inventory/supplier/components/supplier-detail-modal/`, agrega una sección para mostrar la ubicación.
   - Si `maps_url` tiene valor, renderiza:
     ```html
     <a [href]="supplier.maps_url" target="_blank" rel="noopener noreferrer" mat-stroked-button>
       <mat-icon>location_on</mat-icon> Ver ubicación en Google Maps
     </a>
     ```
   - Si está vacío, muestra el texto "Sin ubicación registrada".

6. **Actualiza el servicio Supabase**
   - En `src/app/core/services/supabase/sb-supplier.ts`, verifica que los métodos `add` y `update` incluyan `maps_url` en el payload.

7. **Actualiza la base de datos**
   - En `src/docs/database/migrate.sql`: agrega `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS maps_url TEXT;`
   - En `src/docs/database/tables.sql`: agrega la columna `maps_url TEXT` en la definición de la tabla `suppliers`.

## Consideraciones
- Toma como referencia los componentes existentes en `src/app/features/inventory/supplier/`.
- El botón "Abrir Google Maps" del formulario es un `<a>` nativo (no un `<button>`), para que el navegador lo maneje correctamente con `target="_blank"`.
- Todo enlace externo debe llevar `rel="noopener noreferrer"` por seguridad.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
