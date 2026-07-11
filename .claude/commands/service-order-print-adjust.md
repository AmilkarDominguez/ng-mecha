Ajusta la impresión de la Hoja de Servicios: una sola copia (no duplicada), modal de vista previa más grande, colores de marca movidos a variables globales y bloque de Total General con 3 filas (Sub Total, IVA-IT, Total).

Utiliza un razonamiento: adaptive thinking

Este comando **modifica** el componente de impresión ya existente
(`service-order-print-modal`). No lo crea desde cero — para eso está
`/service-order-print`.

---

## Objetivo

Corregir y rediseñar la vista previa e impresión de la orden de servicio:

1. **Una sola copia.** Hoy el documento se renderiza **dos veces** (copia
   cliente + copia taller) y al imprimir sale en 2 páginas. Debe mostrarse e
   imprimirse **una sola hoja** por orden.
2. **Modal más grande.** La vista previa se ve muy pequeña; el modal debe
   ajustarse al ancho real de la hoja (A4 ≈ 210mm) sin espacio gris sobrante.
3. **Colores como variables globales.** El azul y el rojo del documento deben
   dejar de ser variables SCSS locales y pasar a `src/styles/_variables.scss`
   como tokens `--color-print-*` reutilizables a nivel general.
4. **Azul** de cabeceras de tabla → `#DBEAFE`.
5. **Rojos** (título, logo, recomendación) → `#EF4444`.
6. **Total General** (hoy una sola caja verde) → bloque de **3 filas**:
   - `Sub Total (Total sin IVA)` — fondo `#86EFAC`
   - `IVA - IT (Cálculo del 13%)` — fondo `#22C55E`
   - `Total (Sub Total + IVA - IT)` — fondo `#86EFAC`

---

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `src/styles/_variables.scss` | Agregar tokens `--color-print-*` (bloque `:root` independiente del tema) |
| `src/app/features/service-order/components/service-order-print-modal/service-order-print-modal.scss` | Reemplazar colores por las variables globales + rediseñar el bloque de totales + quitar `.page-break` |
| `src/app/features/service-order/components/service-order-print-modal/service-order-print-modal.html` | Renderizar el documento **una sola vez** + reemplazar la caja de Total General por las 3 filas |
| `src/app/features/service-order/components/service-order-print-modal/service-order-print-modal.ts` | Agregar los computed `subtotalSinIva`, `ivaIt`, `totalFinal` |
| `src/app/features/service-order/service-order-dashboard/service-order-dashboard.ts` | Ajustar el tamaño del modal en `onPrint()` |

> No requiere cambios de base de datos ni de modelo: `total`, `iva`,
> `total_iva` y `with_iva` ya existen en `ServiceOrderWithLines`.

---

## Paso 1 — Tokens de color globales (`src/styles/_variables.scss`)

La hoja impresa se ve igual en tema claro u oscuro, así que estos tokens van en
un bloque `:root` **independiente del tema** (no se redefinen en
`[data-theme='light']`). Agregar al **final** del archivo:

```scss
// ============================================================
// Print tokens — Hoja de Servicios
// Colores del documento físico. Independientes del tema:
// la hoja impresa se ve igual en claro u oscuro.
// ============================================================
:root {
  // Azul de cabeceras / subtotales de tabla (antes navy #1a237e)
  --color-print-blue: #dbeafe;
  --color-print-blue-text: #1e3a8a;

  // Rojo de título, logo y caja de recomendación (antes #c62828)
  --color-print-red: #ef4444;

  // Bloque Total General (3 filas)
  --color-print-subtotal-bg: #86efac; // Sub Total (sin IVA)
  --color-print-iva-bg: #22c55e; // IVA - IT (13%)
  --color-print-total-bg: #86efac; // Total (Sub Total + IVA-IT)
  --color-print-total-text: #14532d; // Texto sobre las 3 filas verdes
}
```

> **Contraste:** `#DBEAFE` y los verdes son tonos claros, por eso el texto
> deja de ser blanco. Sobre el azul se usa `--color-print-blue-text` (azul
> oscuro `#1e3a8a`) y sobre las filas verdes `--color-print-total-text`
> (verde oscuro `#14532d`), ambos legibles al imprimir.

---

## Paso 2 — SCSS del modal (`service-order-print-modal.scss`)

### 2.1 Cabecera de variables

Quitar las variables de color locales (rojo, navy, verde). Solo quedan borde y
fuente; los colores de marca ahora vienen de `_variables.scss`:

```scss
// Los colores de marca (rojo, azul y verdes del documento) viven en
// src/styles/_variables.scss como variables --color-print-*
$print-border: #999999;
$print-border-dark: #333333;
$doc-font: 'Arial', sans-serif;
```

### 2.2 Reemplazos de color (buscar y reemplazar)

| Selector | Antes | Después |
|----------|-------|---------|
| `.doc-title` | `color: $print-red;` | `color: var(--color-print-red);` |
| `.logo-icon` | `background: $print-red;` | `background: var(--color-print-red);` |
| `.logo-name` | `color: $print-red;` | `color: var(--color-print-red);` |
| `.section-title` | `background: $print-navy;`<br>`color: $print-navy-text;`<br>`border: 1px solid $print-navy;` | `background: var(--color-print-blue);`<br>`color: var(--color-print-blue-text);`<br>`border: 1px solid var(--color-print-blue);` |
| `.col-header-row th` | `background: $print-navy;`<br>`color: $print-navy-text;` | `background: var(--color-print-blue);`<br>`color: var(--color-print-blue-text);` |
| `.subtotal-row td` | `background: $print-navy;`<br>`color: $print-navy-text;` | `background: var(--color-print-blue);`<br>`color: var(--color-print-blue-text);` |
| `.recomendacion-box` | `border: 2px solid $print-red;` | `border: 2px solid var(--color-print-red);` |
| `.recomendacion-title` | `color: $print-red;` | `color: var(--color-print-red);` |

### 2.3 Bloque de Total General (3 filas)

Reemplazar **por completo** las reglas `.total-general-box`,
`.total-general-label` y `.total-general-value` por:

```scss
.total-general-box {
  display: flex;
  flex-direction: column;
  align-self: center;
  border: 1px solid $print-border-dark;
}

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3mm;
  padding: 1.5mm 3mm;
  font-weight: 700;
  color: var(--color-print-total-text);

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.18);
  }
}

.total-row--subtotal {
  background: var(--color-print-subtotal-bg);
}
.total-row--iva {
  background: var(--color-print-iva-bg);
}
.total-row--total {
  background: var(--color-print-total-bg);
}

.total-row-label {
  font-size: 8pt;
}

.total-row-value {
  font-size: 11pt;
  white-space: nowrap;
}
```

### 2.4 Quitar el separador de copias

Ya no hay segunda copia, así que **eliminar** la regla `.page-break`:

```scss
// ── ELIMINAR: ya no se usa (una sola copia) ──
.page-break {
  width: 210mm;
  margin: 0 auto;
  border-top: 2px dashed #aaa;
}
```

### 2.5 `@media print`

Con una sola copia ya no hacen falta los saltos de página forzados (evitan la
hoja en blanco extra). Dejar el bloque `.print-document` sin `page-break-*` y
eliminar la regla `.page-break`:

```scss
@media print {
  .no-print {
    display: none !important;
  }

  .print-modal-wrapper {
    background: none;
  }

  .print-document {
    margin: 0;
    border: none;
    padding: 5mm 8mm;
    width: 100%;
  }
}
```

---

## Paso 3 — HTML del modal (`service-order-print-modal.html`)

### 3.1 Renderizar el documento una sola vez

Reemplazar el bloque que renderiza el documento **dos veces** por uno solo:

```html
<!-- ANTES -->
@if (detail(); as d) {
  <ng-container *ngTemplateOutlet="docTemplate; context: { $implicit: d }" />
  <div class="page-break"></div>
  <ng-container *ngTemplateOutlet="docTemplate; context: { $implicit: d }" />
}
```

```html
<!-- DESPUÉS -->
@if (detail(); as d) {
  <ng-container *ngTemplateOutlet="docTemplate; context: { $implicit: d }" />
}
```

### 3.2 Bloque de Total General (3 filas)

Dentro de `.doc-footer`, reemplazar la caja actual:

```html
<!-- ANTES -->
<div class="total-general-box">
  <span class="total-general-label">TOTAL GENERAL (Bs.):</span>
  <span class="total-general-value">{{ totalGeneral() | number:'1.2-2' }}</span>
</div>
```

```html
<!-- DESPUÉS -->
<div class="total-general-box">
  <div class="total-row total-row--subtotal">
    <span class="total-row-label">Sub Total (Total sin IVA)</span>
    <span class="total-row-value">{{ subtotalSinIva() | number:'1.2-2' }}</span>
  </div>
  <div class="total-row total-row--iva">
    <span class="total-row-label">IVA - IT (Cálculo del 13%)</span>
    <span class="total-row-value">{{ ivaIt() | number:'1.2-2' }}</span>
  </div>
  <div class="total-row total-row--total">
    <span class="total-row-label">Total (Sub Total + IVA - IT)</span>
    <span class="total-row-value">{{ totalFinal() | number:'1.2-2' }}</span>
  </div>
</div>
```

---

## Paso 4 — Componente TS (`service-order-print-modal.ts`)

Agregar la constante de tasa y **reemplazar** el computed `totalGeneral` por los
tres nuevos. La semántica de los campos (confirmada en `service-order-form.ts`)
es: `total` = base **sin IVA**, `iva` = 13 % de `total`, `total_iva` = `total + iva`.

```ts
// Al inicio del archivo, junto a los imports
const IVA_RATE = 0.13;
```

```ts
// Reemplaza el computed `totalGeneral` por estos tres:

// Base sin IVA
readonly subtotalSinIva = computed(() => this.detail()?.total ?? 0);

// IVA - IT (13 %). Usa el valor guardado; si falta, lo calcula sobre la base.
readonly ivaIt = computed(() => {
  const d = this.detail();
  if (!d || !d.with_iva) return 0;
  return d.iva ?? (d.total ?? 0) * IVA_RATE;
});

// Total final: con IVA usa total_iva; sin IVA es la base.
readonly totalFinal = computed(() => {
  const d = this.detail();
  if (!d) return 0;
  return d.with_iva ? (d.total_iva ?? (d.total ?? 0) + this.ivaIt()) : (d.total ?? 0);
});
```

> Si `with_iva` es `false`: `ivaIt` = 0 y `totalFinal` = `subtotalSinIva`, así
> las 3 filas siguen siendo coherentes (Sub Total = Total).

---

## Paso 5 — Tamaño del modal (`service-order-dashboard.ts`)

En `onPrint()`, ajustar el diálogo para que se ajuste al ancho de la hoja A4 y
aproveche mejor la pantalla:

```ts
// ANTES
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

```ts
// DESPUÉS
onPrint(order: ServiceOrder): void {
  this.dialog.open(ServiceOrderPrintModal, {
    data: order,
    width: '840px',      // ancho A4 (210mm ≈ 794px) + margen lateral
    maxWidth: '95vw',
    maxHeight: '95vh',
    autoFocus: false,
    panelClass: 'service-order-print-panel',
  });
}
```

> El modal deja de tener 400px de gris sobrante alrededor de la hoja: ahora la
> hoja (≈794px) llena el ancho del diálogo. En pantallas angostas cae a `95vw`.

---

## Verificación

1. Abrir una orden desde el dashboard → botón **Imprimir**.
2. La vista previa muestra **una sola** hoja (no dos), a un tamaño cómodo.
3. Cabeceras de tabla en **azul claro `#DBEAFE`** con texto azul oscuro legible.
4. Título, logo y caja de recomendación en **rojo `#EF4444`**.
5. Bloque de totales con **3 filas**: Sub Total (verde claro), IVA-IT (verde),
   Total (verde claro). Con una orden **sin IVA**, IVA-IT = `0.00` y
   Total = Sub Total.
6. `Ctrl+P` / botón Imprimir → sale en **una sola página** (sin hoja en blanco).
7. `npm run build` sin errores de TypeScript ni SCSS.

---

## Consideraciones

1. **Variables globales, no locales.** El requisito es que el azul y el rojo
   sean tokens “a nivel general”. Van en `src/styles/_variables.scss` como
   `--color-print-*` y se consumen con `var(...)`. No dejar hex sueltos en el
   SCSS del componente para esos colores.
2. **Independiente del tema.** Los tokens de impresión se definen una sola vez
   en `:root`; no se redefinen en `[data-theme='light']` porque el papel siempre
   es blanco.
3. **Legibilidad.** Al pasar de fondos oscuros a claros, el texto blanco dejaría
   de leerse; por eso el texto del azul y de los verdes se oscurece
   (`--color-print-blue-text`, `--color-print-total-text`).
4. **IVA guardado vs calculado.** `ivaIt` prioriza el campo `iva` persistido y
   solo calcula `total * 0.13` como respaldo, para respetar redondeos que ya se
   hayan guardado.
5. **Sin salto de página.** Al quedar una sola copia, se quitan
   `page-break-after` y `.page-break` para no generar una segunda hoja en blanco.
