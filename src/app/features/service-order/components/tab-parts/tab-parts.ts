import { Component, computed, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Batch } from '../../../../core/models/batch.model';
import { ServiceOrderBatchRow } from '../../../../core/models/service-order.model';
import { SPBatch } from '../../../../core/services/supabase/sb-batch';

interface BatchWithRelations extends Batch {
  product?: { name: string } | null;
  industry?: { name: string } | null;
  warehouse?: { name: string } | null;
}

@Component({
  selector: 'app-tab-parts',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    DecimalPipe,
  ],
  templateUrl: './tab-parts.html',
  styleUrl: './tab-parts.scss',
})
export class TabParts {
  private batchService = inject(SPBatch);
  private snackBar = inject(MatSnackBar);

  addItem = output<ServiceOrderBatchRow>();

  readonly allBatches = toSignal(this.batchService.get(), { initialValue: [] });

  readonly searchTerm = signal('');
  readonly selectedBatch = signal<BatchWithRelations | null>(null);

  readonly searchResults = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term || term.length < 2) return [];
    return (this.allBatches() as BatchWithRelations[])
      .filter((b) => b.state === 'ACTIVE')
      .filter((b) => {
        const productName = (b.product?.name ?? '').toLowerCase();
        const desc = (b.description ?? '').toLowerCase();
        const brands = (b.compatible_brands ?? '').toLowerCase();
        const models = (b.compatible_models ?? '').toLowerCase();
        return (
          productName.includes(term) ||
          desc.includes(term) ||
          brands.includes(term) ||
          models.includes(term)
        );
      })
      .slice(0, 8);
  });

  readonly form = new FormGroup({
    price: new FormControl<number | null>({ value: null, disabled: true }, [Validators.required, Validators.min(0)]),
    quantity: new FormControl<number | null>({ value: 1, disabled: true }, [Validators.required, Validators.min(1)]),
  });

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
    if (!val) {
      this.selectedBatch.set(null);
      this.form.controls.price.disable();
      this.form.controls.quantity.disable();
      this.form.patchValue({ price: null, quantity: 1 });
    }
  }

  selectBatch(batch: BatchWithRelations): void {
    this.selectedBatch.set(batch);
    this.searchTerm.set('');
    this.form.controls.price.enable();
    this.form.controls.quantity.enable();
    this.form.patchValue({ price: batch.price ?? null, quantity: 1 });
  }

  clearSelection(): void {
    this.selectedBatch.set(null);
    this.searchTerm.set('');
    this.form.controls.price.disable();
    this.form.controls.quantity.disable();
    this.form.patchValue({ price: null, quantity: 1 });
  }

  onAdd(): void {
    const batch = this.selectedBatch();
    if (!batch) {
      this.snackBar.open('Seleccione un lote', 'Cerrar', { duration: 2500 });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const price = raw.price ?? 0;
    const quantity = raw.quantity ?? 1;

    this.addItem.emit({
      id: crypto.randomUUID(),
      batch_id: batch.id,
      service_order_id: null,
      quantity,
      delivery_time: 'IMMEDIATE',
      price,
      discount: 0,
      subtotal: price * quantity,
      product_name: batch.product?.name ?? batch.description ?? batch.id,
      industry_name: batch.industry?.name ?? '—',
    });

    this.clearSelection();
  }
}
