Agrega el modo edición a las órdenes de servicio reutilizando el formulario existente.

Utiliza un razonamiento: adaptive thinking

Lee `.claude/docs/service-order-flow.md` antes de comenzar. Contiene el estado actual completo del módulo.

---

## Decisión arquitectónica

`ServiceOrderForm` será el mismo componente para crear y editar. El modo se determina por la presencia del parámetro `:id` en la ruta (`ActivatedRoute`). No crear un componente separado.

**Reutilización:**
- `TabCustomer` — ya tiene `initialValue` input declarado pero sin implementar → activar
- `TabLabor`, `TabParts`, `TabExternal` — los tabs solo agregan ítems; las filas iniciales se cargan directamente en las signals del padre (`serviceRows`, `batchRows`, `externalRows`) → no necesitan cambios
- Tablas (`service-order-services-table`, `service-order-batches-table`, `service-order-external-services-table`) — ya están preparadas para edición inline → no necesitan cambios
- `getWithLines(id)` — ya trae todo lo necesario en un solo call → no necesita cambios

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/app/app.routes.ts` | Agregar ruta `/ordenes/editar/:id` |
| `src/app/features/service-order/service-order-form/service-order-form.ts` | Modo dual create/edit |
| `src/app/features/service-order/service-order-form/service-order-form.html` | Título dinámico |
| `src/app/features/service-order/components/tab-customer/tab-customer.ts` | Implementar `initialValue` |
| `src/app/features/service-order/service-order-dashboard/service-order-dashboard.ts` | Botón de edición |
| `src/app/features/service-order/service-order-dashboard/service-order-dashboard.html` | Columna de acciones |
| `src/app/core/services/supabase/sb-service-order.ts` | Ampliar join en `getWithLines` |
| `src/app/core/models/service-order.model.ts` | Ampliar `OrderBatchLine` |
| `src/docs/database/migrate.sql` | No requiere columnas nuevas — no modificar |

---

## Pasos

### 1. Ampliar `getWithLines` para incluir el nombre de industria del lote

En `src/app/core/services/supabase/sb-service-order.ts`, en el query de `batches` dentro de `forkJoin`, ampliar el select de `batch` para incluir la industria:

```
// Cambiar
.select('*, batch:batches(description, product:products(name))')
// Por
.select('*, batch:batches(description, product:products(name), industry:industries(name))')
```

### 2. Actualizar `OrderBatchLine` en el modelo

En `src/app/core/models/service-order.model.ts`, agregar `industry` al tipo anidado de `OrderBatchLine`:

```typescript
// Antes
batch: { description: string | null; product: { name: string | null } | null } | null;

// Después
batch: {
  description: string | null;
  product: { name: string | null } | null;
  industry: { name: string | null } | null;
} | null;
```

### 3. Agregar ruta de edición

En `src/app/app.routes.ts`, dentro de los children de `AdminLayout`, junto a las rutas existentes de ordenes:

```typescript
{
  path: 'ordenes/editar/:id',
  loadComponent: () =>
    import('./features/service-order/service-order-form/service-order-form')
      .then((m) => m.ServiceOrderForm),
},
```

### 4. Convertir `ServiceOrderForm` a modo dual

En `src/app/features/service-order/service-order-form/service-order-form.ts`:

**4.1 — Nuevos imports:**
```typescript
import { OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ServiceOrder,
  OrderServiceLine,
  OrderBatchLine,
  OrderExternalLine,
} from '../../../core/models/service-order.model';
```

**4.2 — Nuevas inyecciones:**
```typescript
private route = inject(ActivatedRoute);
```

**4.3 — Nuevos signals de modo:**
```typescript
readonly isEditMode  = signal(false);
readonly editOrderId = signal<string | null>(null);
readonly loading     = signal(false);
```

**4.4 — Implementar `ngOnInit` (la clase pasa a `implements OnInit`):**
```typescript
ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.isEditMode.set(true);
    this.editOrderId.set(id);
    this.loading.set(true);
    this.serviceOrderProvider.getWithLines(id).subscribe({
      next: (order) => {
        this.summaryForm.patchValue({
          number:       order.number ?? '',
          payment_type: order.payment_type,
          with_iva:     order.with_iva,
          description:  order.description ?? '',
          return_date:  order.return_date ? new Date(order.return_date) : null,
        });
        this.customerTabValue.set({
          customer_id:  order.customer_id,
          vehicle_id:   order.vehicle_id,
          mechanic_id:  order.mechanic_id,
          mileage:      order.mileage,
          started_date: order.started_date,
          ended_date:   order.ended_date,
        });
        this.serviceRows.set(order.order_services.map((l) => this.toServiceRow(l)));
        this.batchRows.set(order.order_batches.map((l) => this.toBatchRow(l)));
        this.externalRows.set(order.order_externals.map((l) => this.toExternalRow(l)));
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar la orden', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/dashboard/ordenes/en-curso']);
      },
    });
  }
}
```

**4.5 — Helpers de mapeo (agregar al final de la clase, antes del cierre `}`):**
```typescript
private toServiceRow(l: OrderServiceLine): ServiceOrderServiceRow {
  return {
    id:               l.id,
    service_id:       l.service_id,
    service_order_id: null,
    price:            l.price,
    quantity:         l.quantity,
    discount:         l.discount,
    subtotal:         l.subtotal,
    service_name:     l.service?.name ?? '',
  };
}

private toBatchRow(l: OrderBatchLine): ServiceOrderBatchRow {
  return {
    id:               l.id,
    batch_id:         l.batch_id,
    service_order_id: null,
    quantity:         l.quantity,
    delivery_time:    l.delivery_time,
    price:            l.price,
    discount:         l.discount,
    subtotal:         l.subtotal,
    product_name:     l.batch?.product?.name ?? '',
    industry_name:    l.batch?.industry?.name ?? '',
  };
}

private toExternalRow(l: OrderExternalLine): ServiceOrderExternalServiceRow {
  return {
    id:                    l.id,
    external_service_id:   l.external_service_id,
    service_order_id:      null,
    bank_account_id:       l.bank_account_id,
    cost:                  l.cost,
    price:                 l.price,
    quantity:              l.quantity,
    subtotal:              l.subtotal,
    external_service_name: l.external_service?.name ?? '',
  };
}
```

**4.6 — Reemplazar `onSave()` para soportar ambos modos:**

```typescript
onSave(): void {
  const tab = this.customerTabValue();
  if (!tab?.customer_id) {
    this.snackBar.open('Debe seleccionar un cliente', 'Cerrar', { duration: 3000 });
    return;
  }

  const raw     = this.summaryForm.value;
  const withIva = raw.with_iva ?? false;

  const payload = {
    customer_id:           tab.customer_id,
    vehicle_id:            tab.vehicle_id,
    mechanic_id:           tab.mechanic_id,
    user_id:               null,
    number:                raw.number || null,
    description:           raw.description || null,
    total:                 this.total(),
    have:                  0,
    must:                  this.totalWithIva(),
    iva:                   withIva ? this.ivaAmount() : null,
    total_iva:             withIva ? this.totalWithIva() : null,
    with_iva:              withIva,
    mileage:               tab.mileage,
    draft_expiration_date: null,
    started_date:          tab.started_date,
    ended_date:            tab.ended_date,
    return_date:           raw.return_date ? raw.return_date.toISOString().split('T')[0] : null,
    state:                 'IN_PROGRESS' as const,
    payment_type:          raw.payment_type ?? 'CASH',
  };

  if (this.isEditMode() && this.editOrderId()) {
    this.executeUpdate(this.editOrderId()!, payload);
  } else {
    this.executeCreate(payload);
  }
}
```

**4.7 — Agregar método `executeCreate` (extraer la lógica actual de `onSave`):**

Extraer todo el cuerpo actual del bloque `onSave()` desde `this.serviceOrderProvider.add(payload)...` y moverlo a un método privado `executeCreate(payload)`. No cambiar esa lógica.

**4.8 — Agregar método `executeUpdate`:**

```typescript
private executeUpdate(orderId: string, payload: object): void {
  this.serviceOrderProvider.update({ id: orderId, ...payload } as ServiceOrder).subscribe({
    next: () => this.syncLines(orderId),
    error: () => {
      this.snackBar.open('Error al actualizar la orden', 'Cerrar', { duration: 4000 });
    },
  });
}

private syncLines(orderId: string): void {
  // Estrategia: eliminar todas las líneas existentes y recrear con el estado actual.
  // Las tablas ya tienen edición inline; al guardar se usa el estado de las signals.
  const services  = this.serviceRows().map((r) => ({
    service_id:       r.service_id,
    service_order_id: orderId,
    price:            r.price,
    quantity:         r.quantity,
    discount:         r.discount,
    subtotal:         r.subtotal,
  }));
  const batches   = this.batchRows().map((r) => ({
    batch_id:         r.batch_id,
    service_order_id: orderId,
    quantity:         r.quantity,
    delivery_time:    r.delivery_time,
    price:            r.price,
    discount:         r.discount,
    subtotal:         r.subtotal,
  }));
  const externals = this.externalRows().map((r) => ({
    external_service_id: r.external_service_id,
    service_order_id:    orderId,
    bank_account_id:     r.bank_account_id,
    cost:                r.cost,
    price:               r.price,
    quantity:            r.quantity,
    subtotal:            r.subtotal,
  }));

  this.serviceOrderProvider.deleteLinesByOrderId(orderId).subscribe({
    next: () => {
      const saves: Observable<unknown>[] = [];
      if (services.length > 0)  saves.push(this.serviceOrderProvider.bulkAddServices(services) as Observable<unknown>);
      if (batches.length > 0)   saves.push(this.serviceOrderProvider.bulkAddBatches(batches) as Observable<unknown>);
      if (externals.length > 0) saves.push(this.serviceOrderProvider.bulkAddExternalServices(externals) as Observable<unknown>);

      if (saves.length === 0) {
        this.snackBar.open('Orden actualizada correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/dashboard/ordenes/en-curso']);
        return;
      }

      let pending = saves.length;
      for (const save of saves) {
        save.subscribe({
          next: () => {
            pending--;
            if (pending === 0) {
              this.snackBar.open('Orden actualizada correctamente', 'Cerrar', { duration: 3000 });
              this.router.navigate(['/dashboard/ordenes/en-curso']);
            }
          },
          error: () => {
            this.snackBar.open('Error al guardar algunos detalles', 'Cerrar', { duration: 4000 });
          },
        });
      }
    },
    error: () => {
      this.snackBar.open('Error al sincronizar las líneas', 'Cerrar', { duration: 4000 });
    },
  });
}
```

### 5. Agregar `deleteLinesByOrderId` en el servicio Supabase

En `src/app/core/services/supabase/sb-service-order.ts`, agregar un método que elimine todas las líneas de las tres tablas pivot para una orden:

```typescript
deleteLinesByOrderId(orderId: string): Observable<void> {
  return forkJoin([
    from(this.supabase.from(this.TABLE_SERVICES).delete().eq('service_order_id', orderId))
      .pipe(map(({ error }) => { if (error) throw error; })),
    from(this.supabase.from(this.TABLE_BATCHES).delete().eq('service_order_id', orderId))
      .pipe(map(({ error }) => { if (error) throw error; })),
    from(this.supabase.from(this.TABLE_EXTERNAL).delete().eq('service_order_id', orderId))
      .pipe(map(({ error }) => { if (error) throw error; })),
  ]).pipe(map(() => void 0));
}
```

### 6. Implementar `initialValue` en `TabCustomer`

En `src/app/features/service-order/components/tab-customer/tab-customer.ts`:

**6.1 — El `initialValue` input ya está declarado.** Solo hay que activarlo en `ngOnInit`.

**6.2 — Agregar lógica de precarga.** El problema de timing: `allCustomers`, `allVehicles`, `allMechanics` cargan async. La estrategia correcta es usar `effect()` para reaccionar cuando los datos estén disponibles:

```typescript
// Agregar import: effect
import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';

// En el constructor (no en ngOnInit) agregar un effect que se dispara cuando hay datos:
constructor() {
  effect(() => {
    const initial  = this.initialValue();
    const customers = this.allCustomers();
    const vehicles  = this.allVehicles();
    const mechanics = this.allMechanics();

    if (!initial || customers.length === 0) return;

    // Prevenir re-ejecución si ya se cargaron datos
    if (this.selectedCustomer() !== null) return;

    if (initial.customer_id) {
      const customer = customers.find((c) => c.id === initial.customer_id) ?? null;
      if (customer) {
        this.customerCtrl.setValue(customer, { emitEvent: false });
        this.selectedCustomer.set(customer);
      }
    }
    if (initial.vehicle_id && vehicles.length > 0) {
      const vehicle = vehicles.find((v) => v.id === initial.vehicle_id) ?? null;
      if (vehicle) {
        this.vehicleCtrl.setValue(vehicle, { emitEvent: false });
        this.selectedVehicle.set(vehicle);
      }
    }
    if (initial.mechanic_id && mechanics.length > 0) {
      const mechanic = mechanics.find((m) => m.id === initial.mechanic_id) ?? null;
      if (mechanic) {
        this.mechanicCtrl.setValue(mechanic, { emitEvent: false });
        this.selectedMechanic.set(mechanic);
      }
    }
    this.form.patchValue({
      mileage:      initial.mileage ?? '',
      started_date: initial.started_date ? new Date(initial.started_date) : null,
      ended_date:   initial.ended_date   ? new Date(initial.ended_date)   : null,
    }, { emitEvent: false });
  });
}
```

**6.3 — Pasar `initialValue` desde el template del formulario padre.**

En `service-order-form.html`:
```html
<!-- Cambiar de: -->
<app-tab-customer (valueChange)="onCustomerTabChange($event)" />
<!-- A: -->
<app-tab-customer
  [initialValue]="customerTabValue()"
  (valueChange)="onCustomerTabChange($event)" />
```

> **Precaución:** `customerTabValue` en modo creación es `null` hasta que el usuario selecciona un cliente, lo que es correcto. En modo edición, se carga en `ngOnInit` y el signal se actualiza antes de que el usuario interactúe con el tab.

### 7. Actualizar el título del formulario

En `service-order-form.html`, cambiar el `h1` del header:

```html
<!-- Cambiar de: -->
<h1 class="page-title">Nueva Orden de Servicio</h1>
<span class="page-subtitle">Complete los datos para registrar una orden de servicio</span>

<!-- A: -->
<h1 class="page-title">{{ isEditMode() ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio' }}</h1>
<span class="page-subtitle">
  {{ isEditMode() ? 'Modifique los datos de la orden de servicio' : 'Complete los datos para registrar una orden de servicio' }}
</span>
```

Y el botón de guardar:
```html
<!-- Cambiar de: -->
Registrar Orden
<!-- A: -->
{{ isEditMode() ? 'Actualizar Orden' : 'Registrar Orden' }}
```

Mostrar spinner de carga mientras se obtienen los datos iniciales en modo edición. Agregar al template, en la parte superior del `.form-layout`:

```html
@if (loading()) {
  <div class="loading-overlay">
    <mat-progress-spinner mode="indeterminate" diameter="48" />
  </div>
}
```

Importar `MatProgressSpinnerModule` en los imports del componente.

### 8. Agregar botón de edición en el dashboard

En `src/app/features/service-order/service-order-dashboard/service-order-dashboard.ts`:

**8.1 — Agregar imports:**
```typescript
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
```

**8.2 — Inyectar Router:**
```typescript
private router = inject(Router);
```

**8.3 — Agregar método:**
```typescript
onEdit(order: ServiceOrder): void {
  this.router.navigate(['/dashboard/ordenes/editar', order.id]);
}
```

**8.4 — En `service-order-dashboard.html`, agregar botón de edición en la columna de acciones junto al botón de ver:**
```html
<button mat-icon-button
        matTooltip="Editar orden"
        (click)="onEdit(row)">
  <mat-icon>edit</mat-icon>
</button>
```

---

## Consideraciones

1. **Estrategia de sincronización de líneas**: Se usa delete-all + re-insert por simplicidad y confiabilidad. Las filas conservan sus campos editados inline (precio, cantidad, descuento) porque las tablas mutan el objeto directamente y las signals del padre siempre reflejan el estado actual de la UI.

2. **`have` en actualización**: El campo `have` (pagado) no se toca en esta operación. Si el taller tiene funcionalidad de pagos parciales en el futuro, `have` debe excluirse del payload de update o leerse del estado actual de la orden.

3. **`state` en actualización**: El payload siempre manda `state: 'IN_PROGRESS'`. Si en el futuro la edición debe preservar el estado actual (COMPLETED, CANCELED), leer el estado desde `editingOrder` antes de construir el payload.

4. **Timing del `effect` en `TabCustomer`**: El effect solo actúa si `selectedCustomer()` es `null`. Esto evita sobreescribir una selección manual del usuario si el componente se re-renderiza con el mismo `initialValue`.

5. **`initialValue` en modo creación**: El tab recibe `null` como `initialValue` en modo creación (el signal `customerTabValue` empieza en `null`). El `effect` tiene el guard `if (!initial || customers.length === 0) return;` que lo protege.

6. **No usar `ngOnInit` para la precarga del tab**: `allCustomers()` viene de `toSignal(this.customerService.get(), ...)` que es async. En `ngOnInit` los datos pueden no estar disponibles aún. `effect()` reacciona cuando el signal cambia, garantizando que los datos ya están cargados.

7. **Sigue las convenciones del CLAUDE.md**: signals, Angular Material, sin HTTP.
