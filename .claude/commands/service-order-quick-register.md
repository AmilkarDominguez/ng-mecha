Agrega botones de registro rápido de cliente, servicio y repuesto dentro del formulario de orden de servicio

Utiliza un razonamiento: adaptive thinking

## Contexto
En el formulario de registro de orden de servicio (`src/app/features/service-order/service-order-form/`), el operador necesita poder registrar un cliente, un servicio o un repuesto (lote) sin salir del formulario.
Se deben agregar botones de acción rápida que abran el modal de creación correspondiente directamente desde la pantalla de orden de servicio.

> Antes de implementar, leer:
> - `src/app/features/service-order/service-order-form/service-order-form.ts` — formulario principal actual
> - `src/app/features/service-order/components/tab-customer/tab-customer.ts` — Tab 1
> - `src/app/features/service-order/components/tab-labor/tab-labor.ts` — Tab 2
> - `src/app/features/service-order/components/tab-parts/tab-parts.ts` — Tab 3
> - Los modales existentes: `customer-form-modal`, `service-form-modal`, `batch-form-modal`

## Pasos

### 1. Botón "Nuevo Cliente" en Tab 1
- En `src/app/features/service-order/components/tab-customer/tab-customer.ts`:
  - Agrega un botón `mat-icon-button` o `mat-stroked-button` con ícono `add` junto al autocomplete de clientes.
  - Al hacer clic, abre el `CustomerFormModal` con `MatDialog`.
  - Tras cerrar el modal con resultado exitoso (nuevo cliente creado), actualiza la lista de clientes y selecciona automáticamente el cliente recién creado en el autocomplete.
  - Importa `MatDialog` y el componente `CustomerFormModal` desde `src/app/features/workshop/customers/components/customer-form-modal/`.

### 2. Botón "Nuevo Servicio" en Tab 2
- En `src/app/features/service-order/components/tab-labor/tab-labor.ts`:
  - Agrega un botón junto al autocomplete de servicios.
  - Al hacer clic, abre el `ServiceFormModal` con `MatDialog`.
  - Tras cerrar con resultado exitoso, actualiza la lista y selecciona el servicio nuevo.
  - Importa el componente `ServiceFormModal` desde `src/app/features/workshop/services/components/service-form-modal/`.

### 3. Botón "Nuevo Repuesto" en Tab 3
- En `src/app/features/service-order/components/tab-parts/tab-parts.ts`:
  - Agrega un botón junto al buscador de lotes (batches).
  - Al hacer clic, abre el modal de creación de lote o producto.
  - Si el modal de batch requiere datos previos (producto, almacén, proveedor), usar `BatchFormModal` desde `src/app/features/inventory/batches/components/batch-form-modal/`.
  - Tras cerrar con resultado exitoso, actualiza la lista de lotes disponibles y selecciona el lote nuevo.

### 4. Patrón de apertura de modales
- Usa `MatDialog.open(Modal, { data: { mode: 'create' }, width: '...' })` consistente con el patrón ya usado en los dashboards del proyecto.
- El resultado del dialog debe tener una propiedad que indique si se creó un registro nuevo y cuál es su `id` o el objeto completo.
- Tras recibir el resultado, llama al método `get()` del servicio correspondiente para recargar la lista (los servicios usan Supabase realtime, pero si usan signal manual, fuerza la recarga).

### 5. Estilo de los botones
- Los botones deben ser discretos: `mat-icon-button` con ícono `add_circle` o `add`.
- Tooltip en español: "Registrar nuevo cliente", "Registrar nuevo servicio", "Registrar nuevo repuesto".
- Usar `MatTooltipModule` para los tooltips.
- Posición: a la derecha del campo de autocomplete, en la misma fila.

## Consideraciones
- No duplicar lógica de los modales existentes: reutilizarlos tal cual están.
- Si los modales existentes no retornan el objeto creado en `dialogRef.close()`, modificar mínimamente el modal para que lo retorne.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
- Verificar que los modales importados sean standalone y compatibles con Angular 21.
