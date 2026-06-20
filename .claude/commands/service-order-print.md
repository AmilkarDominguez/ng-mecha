Crea el componente de impresión de la Hoja de Servicios del taller Mecatrónica.

Utiliza un razonamiento: adaptive thinking

Lee `.claude/docs/service-order-flow.md` antes de comenzar.

---

## Objetivo

Crear un modal de previsualización e impresión de la orden de servicio con el diseño exacto de la "Hoja de Servicios" del taller. El modal se abre desde el botón de impresión en la tabla del dashboard. El documento se renderiza dos veces (duplicado físico: copia cliente + copia taller) y se puede imprimir directamente desde el navegador.

---

## Diseño del documento (referencia visual)

### Paleta de colores exacta

```scss
$print-red:         #c62828;   // Título, borde Recomendación, título Recomendación
$print-navy:        #1a237e;   // Fondo de cabeceras de tabla, fila subtotal
$print-navy-text:   #ffffff;   // Texto sobre fondo navy
$print-green:       #2e7d32;   // Fondo Total General
$print-green-text:  #ffffff;   // Texto sobre fondo verde
$print-border:      #999999;   // Bordes de tabla y celdas
$print-row-alt:     #f5f5f5;   // Filas alternadas (opcional, muy sutil)
```

### Layout general (A4 horizontal en dos copias verticales)

```
┌──────────────────────────────────────────────────────────────────┐
│  HOJA DE SERVICIOS #XXXX              (título centrado, rojo)    │
│  Cliente: _____ Placa: _____ Fecha Ing: _____  ┌──────────┐     │
│  Vehículo: ____  Kilometraje: __ Fecha Entrega: │  LOGO   │     │
│                                                  └──────────┘    │
│  "ESPECIALIZADOS EN TU VEHÍCULO, PRIORIZANDO TU VIDA"            │
├─────────────────────────────────┬────────────────────────────────┤
│  Lista de trabajos de mano obra │  Lista de repuestos e insumos  │
│  ITEM│DESCRIPCIÓN│UNIDAD│P.UNIT │  CANT│DESCRIPCIÓN│P.UNIT│TOTAL│
│  [TOTAL MANO DE OBRA]   140.00  │  [REP, TRAB ADIC E INSUM] 164 │
│  1 │ CAMBIO TRANSMISION │ 80│1  │  1 │ LAVANDERIA    │10 │ 10  │
│  2 │ PASTILLAS DELANT.  │  │1  │  1 │ RETENES       │25 │ 25  │
│  ...                            │  ...                          │
├────────────────┬────────────────┴────────────────────────────────┤
│ RECOMENDACIÓN  │                TOTAL GENERAL (Bs.):    304.00   │
│ - CAMBIAR ...  │                (fondo verde)                    │
├────────────────┴─────────────────────────────────────────────────│
│                ----------------                                  │
│                ING. RODRIGO VACA                                  │
│                ASESOR DE SERVICIOS                                │
└──────────────────────────────────────────────────────────────────┘
  [página break]
┌── Segunda copia idéntica ────────────────────────────────────────┐
```

---

## Mapeo de datos

| Campo visual | Fuente en `ServiceOrderWithLines` |
|---|---|
| `#XXXX` | `order.number ?? order.id.slice(0,8)` |
| Cliente | `[order.customer?.name, order.customer?.lastname].join(' ')` |
| Placa | `order.vehicle?.license_plate` |
| Fecha Ing | `order.started_date` formateado `d/M/yyyy` |
| Vehículo | `[order.vehicle?.brand, order.vehicle?.model].join('/ ')` |
| Kilometraje | `order.mileage` con formato numérico |
| Fecha Entrega | `order.return_date` formateado `d/M/yyyy` |
| Tabla mano de obra | `order.order_services[]` |
| Tabla repuestos + externos | `order.order_batches[]` + `order.order_externals[]` (concatenados) |
| TOTAL MANO DE OBRA | `sum(order_services[].subtotal)` |
| REPUESTOS... TOTAL | `sum(order_batches[].subtotal) + sum(order_externals[].subtotal)` |
| TOTAL GENERAL | `order.with_iva ? order.total_iva : order.total` |
| RECOMENDACIÓN | `order.description` |
| Asesor / Mecánico | `[order.mechanic?.name, order.mechanic?.lastname].join(' ')` |

### Tabla mano de obra — columnas

| ITEM | DESCRIPCIÓN | UNIDAD | P.UNIT (Bs.) | CANT | TOTAL (Bs.) |
|------|-------------|--------|--------------|------|-------------|
| auto | `service?.name` | `"SERVICIO"` | `price` (si > 0) | `quantity` | `subtotal` (si > 0, sino `"-"`) |

### Tabla repuestos e insumos — columnas

| CANT | DESCRIPCIÓN | P.UNIT (Bs.) | TOTAL (Bs) |
|------|-------------|--------------|------------|
| `quantity` | `batch?.product?.name` o `external_service?.name` | `price` | `subtotal` |

---

## Archivos a crear / modificar

| Archivo | Acción |
|---------|--------|
| `src/app/features/service-order/components/service-order-print-modal/service-order-print-modal.ts` | CREAR |
| `src/app/features/service-order/components/service-order-print-modal/service-order-print-modal.html` | CREAR |
| `src/app/features/service-order/components/service-order-print-modal/service-order-print-modal.scss` | CREAR |
| `src/app/features/service-order/service-order-dashboard/service-order-dashboard.ts` | MODIFICAR — agregar `onPrint()` |
| `src/app/features/service-order/service-order-dashboard/service-order-dashboard.html` | MODIFICAR — agregar botón print |
| `src/styles.scss` | MODIFICAR — agregar reglas `@media print` globales |

---

## Paso 1 — Crear `service-order-print-modal.ts`

```typescript
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ServiceOrder, ServiceOrderWithLines } from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';

@Component({
  selector: 'app-service-order-print-modal',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  templateUrl: './service-order-print-modal.html',
  styleUrl: './service-order-print-modal.scss',
})
export class ServiceOrderPrintModal implements OnInit {
  private orderService = inject(SPServiceOrder);
  private dialogRef = inject(MatDialogRef<ServiceOrderPrintModal>);
  readonly data = inject<ServiceOrder>(MAT_DIALOG_DATA);

  readonly loading  = signal(true);
  readonly hasError = signal(false);
  readonly detail   = signal<ServiceOrderWithLines | null>(null);

  // Subtotales calculados desde las líneas cargadas
  readonly subtotalServices = computed(() =>
    (this.detail()?.order_services ?? []).reduce((s, l) => s + (l.subtotal ?? 0), 0),
  );

  readonly subtotalParts = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    const batches   = d.order_batches.reduce((s, l) => s + (l.subtotal ?? 0), 0);
    const externals = d.order_externals.reduce((s, l) => s + (l.subtotal ?? 0), 0);
    return batches + externals;
  });

  readonly totalGeneral = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    return d.with_iva ? (d.total_iva ?? d.total ?? 0) : (d.total ?? 0);
  });

  ngOnInit(): void {
    this.orderService.getWithLines(this.data.id).subscribe({
      next: (order) => {
        this.detail.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });
  }

  customerName(): string {
    const d = this.detail();
    if (!d?.customer) return '—';
    return [d.customer.name, d.customer.lastname].filter(Boolean).join(' ');
  }

  vehicleDesc(): string {
    const v = this.detail()?.vehicle;
    if (!v) return '—';
    return [v.brand, v.model].filter(Boolean).join('/ ');
  }

  mechanicName(): string {
    const m = this.detail()?.mechanic;
    if (!m) return '—';
    return [m.name, m.lastname].filter(Boolean).join(' ').toUpperCase();
  }

  orderNumber(): string {
    const d = this.detail();
    if (!d) return '';
    return d.number ? `#${d.number}` : `#${d.id.slice(0, 8).toUpperCase()}`;
  }

  // En la tabla de mano de obra, muestra guión si el subtotal es 0 o null
  serviceTotal(subtotal: number | null): string {
    return subtotal && subtotal > 0 ? subtotal.toFixed(2) : '-';
  }

  onPrint(): void {
    window.print();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
```

---

## Paso 2 — Crear `service-order-print-modal.html`

El documento se repite dos veces. Usar `ng-template` para evitar duplicación de código.

```html
<div class="print-modal-wrapper">

  <!-- Barra de acciones (oculta al imprimir) -->
  <div class="modal-actions no-print">
    <span class="modal-title">Vista previa de impresión</span>
    <div class="action-buttons">
      <button mat-stroked-button (click)="onClose()">Cerrar</button>
      <button mat-flat-button color="primary" (click)="onPrint()">
        <mat-icon>print</mat-icon>
        Imprimir
      </button>
    </div>
  </div>

  <!-- Estado de carga -->
  @if (loading()) {
    <div class="loading-state no-print">
      <mat-progress-spinner mode="indeterminate" diameter="48" />
    </div>
  }

  @if (hasError()) {
    <div class="error-state no-print">Error al cargar los datos de la orden.</div>
  }

  <!-- Documento (se repite 2 veces para duplicado) -->
  @if (detail(); as d) {
    <ng-container
      *ngTemplateOutlet="docTemplate; context: { $implicit: d }"
    />
    <div class="page-break"></div>
    <ng-container
      *ngTemplateOutlet="docTemplate; context: { $implicit: d }"
    />
  }

</div>

<!-- Template del documento -->
<ng-template #docTemplate let-d>
  <div class="print-document">

    <!-- Título -->
    <h1 class="doc-title">HOJA DE SERVICIOS {{ orderNumber() }}</h1>

    <!-- Encabezado con datos y logo -->
    <table class="header-table">
      <tbody>
        <tr>
          <td class="header-label">Cliente:</td>
          <td class="header-value">{{ customerName() }}</td>
          <td class="header-label">Placa:</td>
          <td class="header-value">{{ d.vehicle?.license_plate ?? '—' }}</td>
          <td class="header-label">Fecha Ing:</td>
          <td class="header-value">{{ d.started_date | date:'d/M/yyyy' }}</td>
          <td class="logo-cell" rowspan="2">
            <div class="company-logo">
              <div class="logo-icon">
                <span class="logo-letters">M</span>
              </div>
              <div class="logo-text">
                <span class="logo-name">MECATRÓNICA</span>
                <span class="logo-sub">Taller Mecánico Electrónico</span>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="header-label">Vehículo:</td>
          <td class="header-value">{{ vehicleDesc() }}</td>
          <td class="header-label">Kilometraje:</td>
          <td class="header-value">{{ d.mileage ?? '—' }}</td>
          <td class="header-label">Fecha Entrega:</td>
          <td class="header-value">{{ d.return_date | date:'d/M/yyyy' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Eslogan -->
    <div class="doc-slogan">
      "ESPECIALIZADOS EN TU VEHÍCULO, PRIORIZANDO TU VIDA"
    </div>

    <!-- Tablas principales -->
    <div class="doc-tables">

      <!-- Tabla izquierda: Mano de Obra -->
      <table class="data-table services-table">
        <thead>
          <tr>
            <th colspan="6" class="section-title">Lista de trabajos de mano de obra</th>
          </tr>
          <tr class="col-header-row">
            <th class="col-item">ITEM</th>
            <th class="col-desc">DESCRIPCIÓN</th>
            <th class="col-unit">UNIDAD</th>
            <th class="col-price">P.UNIT (Bs.)</th>
            <th class="col-qty">CANT</th>
            <th class="col-total">TOTAL (Bs.)</th>
          </tr>
          <tr class="subtotal-row">
            <td colspan="5" class="subtotal-label">TOTAL MANO DE OBRA</td>
            <td class="subtotal-value">{{ subtotalServices() | number:'1.2-2' }}</td>
          </tr>
        </thead>
        <tbody>
          @for (line of d.order_services; track line.id; let i = $index) {
            <tr>
              <td class="col-item">{{ i + 1 }}</td>
              <td class="col-desc">{{ line.service?.name ?? '—' }}</td>
              <td class="col-unit">SERVICIO</td>
              <td class="col-price">{{ line.price && line.price > 0 ? (line.price | number:'1.0-0') : '' }}</td>
              <td class="col-qty">{{ line.quantity }}</td>
              <td class="col-total">{{ serviceTotal(line.subtotal) }}</td>
            </tr>
          }
          @if (d.order_services.length === 0) {
            <tr><td colspan="6" class="empty-row">Sin servicios registrados</td></tr>
          }
        </tbody>
      </table>

      <!-- Tabla derecha: Repuestos + Externos -->
      <table class="data-table parts-table">
        <thead>
          <tr>
            <th colspan="4" class="section-title">Lista de repuestos e insumos</th>
          </tr>
          <tr class="col-header-row">
            <th class="col-qty">CANT</th>
            <th class="col-desc">DESCRIPCIÓN</th>
            <th class="col-price">P.UNIT (Bs.)</th>
            <th class="col-total">TOTAL (Bs)</th>
          </tr>
          <tr class="subtotal-row">
            <td colspan="3" class="subtotal-label">REPUESTOS, TRABAJOS ADICIONALES E INSUMOS</td>
            <td class="subtotal-value">{{ subtotalParts() | number:'1.2-2' }}</td>
          </tr>
        </thead>
        <tbody>
          @for (line of d.order_batches; track line.id) {
            <tr>
              <td class="col-qty">{{ line.quantity }}</td>
              <td class="col-desc">{{ line.batch?.product?.name ?? '—' }}</td>
              <td class="col-price">{{ line.price ?? '' }}</td>
              <td class="col-total">{{ line.subtotal ? (line.subtotal | number:'1.2-2') : '-' }}</td>
            </tr>
          }
          @for (line of d.order_externals; track line.id) {
            <tr>
              <td class="col-qty">{{ line.quantity }}</td>
              <td class="col-desc">{{ line.external_service?.name ?? '—' }}</td>
              <td class="col-price">{{ line.price ?? '' }}</td>
              <td class="col-total">{{ line.subtotal ? (line.subtotal | number:'1.2-2') : '-' }}</td>
            </tr>
          }
          @if (d.order_batches.length === 0 && d.order_externals.length === 0) {
            <tr><td colspan="4" class="empty-row">Sin repuestos registrados</td></tr>
          }
        </tbody>
      </table>

    </div>

    <!-- Pie del documento -->
    <div class="doc-footer">

      <div class="recomendacion-box">
        <div class="recomendacion-title">RECOMENDACIÓN</div>
        <div class="recomendacion-body">{{ d.description ?? '' }}</div>
      </div>

      <div class="total-general-box">
        <span class="total-general-label">TOTAL GENERAL (Bs.):</span>
        <span class="total-general-value">{{ totalGeneral() | number:'1.2-2' }}</span>
      </div>

    </div>

    <!-- Firma -->
    <div class="doc-signature">
      <div class="signature-line">- - - - - - - - - - - - - - - - - - - - - - - - -</div>
      <div class="signature-name">{{ mechanicName() }}</div>
      <div class="signature-role">ASESOR DE SERVICIOS</div>
    </div>

  </div>
</ng-template>
```

> **Nota**: `NgTemplateOutlet` requiere importarlo en el componente: `import { NgTemplateOutlet } from '@angular/common';` y agregarlo al array `imports`.

---

## Paso 3 — Crear `service-order-print-modal.scss`

```scss
// Variables de diseño del documento físico
$print-red:       #c62828;
$print-navy:      #1a237e;
$print-navy-text: #ffffff;
$print-green:     #2e7d32;
$print-green-text:#ffffff;
$print-border:    #999999;
$print-border-dark: #333333;
$doc-font:        'Arial', sans-serif;

// ──────────────────────────────────────────
// Modal wrapper (modo pantalla)
// ──────────────────────────────────────────

.print-modal-wrapper {
  padding: 0;
  background: #e0e0e0;
  min-height: 100vh;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #ccc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-title {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

// ──────────────────────────────────────────
// Documento imprimible
// ──────────────────────────────────────────

.print-document {
  width: 210mm;
  min-height: 148mm;
  margin: 1.5rem auto;
  padding: 8mm 10mm;
  background: #fff;
  font-family: $doc-font;
  font-size: 8pt;
  color: #000;
  border: 1px solid #ccc;
}

.page-break {
  margin: 0.5rem auto;
  width: 210mm;
  border-top: 2px dashed #ccc;
}

// ──────────────────────────────────────────
// Título principal
// ──────────────────────────────────────────

.doc-title {
  text-align: center;
  font-size: 14pt;
  font-weight: 700;
  color: $print-red;
  text-decoration: underline;
  margin: 0 0 4mm;
  text-transform: uppercase;
}

// ──────────────────────────────────────────
// Encabezado (tabla de datos + logo)
// ──────────────────────────────────────────

.header-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 3mm;

  td {
    padding: 1mm 2mm;
    vertical-align: middle;
  }
}

.header-label {
  font-weight: 700;
  font-size: 8pt;
  white-space: nowrap;
  width: 1%;
}

.header-value {
  border-bottom: 1px solid $print-border-dark;
  font-size: 8pt;
  min-width: 30mm;
  padding-bottom: 0.5mm;
}

.logo-cell {
  text-align: right;
  vertical-align: middle;
  width: 40mm;
}

.company-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1mm;
}

.logo-icon {
  width: 12mm;
  height: 12mm;
  background: $print-red;
  border-radius: 2mm;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;

  .logo-letters {
    color: #fff;
    font-size: 10pt;
    font-weight: 900;
  }
}

.logo-name {
  display: block;
  font-size: 10pt;
  font-weight: 900;
  color: $print-red;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.logo-sub {
  display: block;
  font-size: 6pt;
  color: #555;
}

// ──────────────────────────────────────────
// Eslogan
// ──────────────────────────────────────────

.doc-slogan {
  text-align: center;
  font-size: 9pt;
  font-weight: 700;
  margin: 2mm 0 3mm;
  border-top: 1px solid $print-border;
  border-bottom: 1px solid $print-border;
  padding: 1.5mm 0;
}

// ──────────────────────────────────────────
// Contenedor de las dos tablas
// ──────────────────────────────────────────

.doc-tables {
  display: grid;
  grid-template-columns: 57% 43%;
  gap: 0;
  border: 1px solid $print-border-dark;
}

// ──────────────────────────────────────────
// Tablas de datos
// ──────────────────────────────────────────

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7.5pt;

  th,
  td {
    border: 1px solid $print-border;
    padding: 0.75mm 1mm;
    vertical-align: middle;
  }
}

.services-table {
  border-right: 2px solid $print-border-dark;
}

// Fila de sección (encabezado de tabla)
.section-title {
  background: $print-navy;
  color: $print-navy-text;
  text-align: center;
  font-size: 8pt;
  font-weight: 700;
  padding: 1.5mm;
  text-transform: uppercase;
}

// Fila de cabeceras de columna
.col-header-row {
  th {
    background: $print-navy;
    color: $print-navy-text;
    font-weight: 700;
    text-align: center;
    font-size: 7pt;
    text-transform: uppercase;
    padding: 1mm;
  }
}

// Fila de subtotal (TOTAL MANO DE OBRA / REPUESTOS...)
.subtotal-row {
  td {
    background: $print-navy;
    color: $print-navy-text;
    font-weight: 700;
    font-size: 7.5pt;
    text-transform: uppercase;
  }

  .subtotal-label {
    text-align: left;
  }

  .subtotal-value {
    text-align: right;
    white-space: nowrap;
  }
}

// Anchos de columna — tabla mano de obra
.services-table {
  .col-item  { width: 6%;  text-align: center; }
  .col-desc  { width: 40%; }
  .col-unit  { width: 14%; text-align: center; }
  .col-price { width: 13%; text-align: right; }
  .col-qty   { width: 8%;  text-align: center; }
  .col-total { width: 13%; text-align: right; }
}

// Anchos de columna — tabla repuestos
.parts-table {
  .col-qty   { width: 10%; text-align: center; }
  .col-desc  { width: 55%; }
  .col-price { width: 17%; text-align: right; }
  .col-total { width: 18%; text-align: right; }
}

.empty-row {
  text-align: center;
  color: #888;
  font-style: italic;
}

// ──────────────────────────────────────────
// Pie del documento
// ──────────────────────────────────────────

.doc-footer {
  display: grid;
  grid-template-columns: 55% 45%;
  gap: 0;
  margin-top: 3mm;
  min-height: 20mm;
}

.recomendacion-box {
  border: 2px solid $print-red;
  padding: 1.5mm 2mm;
  margin-right: 3mm;
}

.recomendacion-title {
  color: $print-red;
  font-weight: 700;
  font-size: 8.5pt;
  text-align: center;
  text-transform: uppercase;
  margin-bottom: 1.5mm;
}

.recomendacion-body {
  font-size: 7.5pt;
  white-space: pre-line;
  line-height: 1.4;
}

.total-general-box {
  background: $print-green;
  color: $print-green-text;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2mm 3mm;
  font-weight: 700;
  font-size: 10pt;
  align-self: center;
}

.total-general-label {
  font-size: 9pt;
}

.total-general-value {
  font-size: 12pt;
}

// ──────────────────────────────────────────
// Firma
// ──────────────────────────────────────────

.doc-signature {
  text-align: center;
  margin-top: 4mm;
  font-size: 8pt;
}

.signature-line {
  color: #666;
  letter-spacing: 0.05em;
  margin-bottom: 1mm;
}

.signature-name {
  font-weight: 700;
  font-size: 9pt;
  text-transform: uppercase;
}

.signature-role {
  font-size: 7.5pt;
  color: #333;
}

// ──────────────────────────────────────────
// Estilos de impresión
// ──────────────────────────────────────────

@media print {
  .no-print {
    display: none !important;
  }

  .print-document {
    margin: 0;
    border: none;
    padding: 5mm 8mm;
    width: 100%;
    page-break-after: always;
  }

  .print-document:last-of-type {
    page-break-after: avoid;
  }

  .page-break {
    display: none;
  }

  .print-modal-wrapper {
    background: none;
  }
}
```

---

## Paso 4 — Agregar estilos globales de impresión en `src/styles.scss`

Al final del archivo, agregar:

```scss
// ── Impresión de Hoja de Servicios ──────────────────────────────
@media print {
  body > *:not(.cdk-overlay-container) {
    display: none !important;
  }

  .cdk-overlay-backdrop {
    display: none !important;
  }

  .service-order-print-panel {
    .mat-mdc-dialog-surface {
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
    }

    .mat-mdc-dialog-container {
      width: 100vw !important;
      max-width: 100vw !important;
      height: auto !important;
    }
  }
}
```

---

## Paso 5 — Agregar `onPrint()` en `ServiceOrderDashboard`

En `service-order-dashboard.ts`:

```typescript
// Agregar import
import { ServiceOrderPrintModal } from '../components/service-order-print-modal/service-order-print-modal';

// Agregar método (junto a onView y onEdit):
onPrint(order: ServiceOrder): void {
  this.dialog.open(ServiceOrderPrintModal, {
    data: order,
    width: '95vw',
    maxWidth: '1200px',
    maxHeight: '90vh',
    panelClass: 'service-order-print-panel',
  });
}
```

> **Nota**: Este modal usa `panelClass: 'service-order-print-panel'` y **NO** usa `hasBackdrop: false` ni `floating-dialog-panel`. Es un modal estándar con backdrop (no arrastrable) porque debe ser estático para imprimir correctamente.

---

## Paso 6 — Agregar botón de impresión en `service-order-dashboard.html`

En la columna de acciones, junto a los botones de editar y ver:

```html
<button mat-icon-button matTooltip="Imprimir hoja de servicios" (click)="onPrint(row)">
  <mat-icon>print</mat-icon>
</button>
```

El orden de los botones en la fila de acciones debe ser:
1. `edit` — Editar orden
2. `print` — Imprimir hoja
3. `visibility` — Ver detalle

---

## Consideraciones

1. **Duplicado físico**: El documento se renderiza dos veces en el HTML (cliente + taller). En `@media print`, cada `.print-document` tiene `page-break-after: always`, excepto el último, para controlar el salto de página. Con papel A4 y dos copias del mismo tamaño, ambas cabrán en una sola hoja.

2. **Logo**: El diseño usa un bloque CSS simple (cuadrado rojo con "M") como placeholder del logo. Para producción, reemplazar por una imagen real: `<img src="assets/logo-mecatronica.png" class="logo-img" />` y ajustar el SCSS.

3. **`NgTemplateOutlet`**: Agregar `NgTemplateOutlet` a los imports del componente para poder usar `*ngTemplateOutlet` en el template y evitar duplicar el HTML del documento.

4. **Mecánico como asesor**: Si `mechanic` es null, la línea de firma muestra `'—'`. El campo no tiene título hardcoded — si el negocio tiene un asesor fijo diferente al mecánico, crear un campo de configuración separado.

5. **Precio en la tabla de mano de obra**: Los servicios con `price: 0` o `price: null` no muestran precio (queda en blanco). El subtotal de esos ítems muestra `"-"` (lógica en `serviceTotal()`). Esto replica el comportamiento visto en la imagen donde algunos ítems no tienen precio visible.

6. **No requiere cambios en la base de datos ni en el modelo** — todos los datos necesarios ya están en `ServiceOrderWithLines`.

7. **Sigue las convenciones del CLAUDE.md**: signals, Angular Material, sin HTTP.
