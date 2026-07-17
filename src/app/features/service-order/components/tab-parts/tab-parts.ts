import { Component, computed, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Batch } from '../../../../core/models/batch.model';
import { ServiceOrderBatchRow } from '../../../../core/models/service-order.model';
import { SPBatch } from '../../../../core/services/supabase/sb-batch';
import { SPProduct } from '../../../../core/services/supabase/sb-product';
import { SPWarehouse } from '../../../../core/services/supabase/sb-warehouse';
import { SPSupplier } from '../../../../core/services/supabase/sb-supplier';
import { SPIndustry } from '../../../../core/services/supabase/sb-industry';
import { SPBrand } from '../../../../core/services/supabase/sb-brand';
import { BatchFormModal } from '../../../inventory/batches/components/batch-form-modal/batch-form-modal';

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
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    DecimalPipe,
  ],
  templateUrl: './tab-parts.html',
  styleUrl: './tab-parts.scss',
})
export class TabParts {
  private batchService = inject(SPBatch);
  private productService = inject(SPProduct);
  private warehouseService = inject(SPWarehouse);
  private supplierService = inject(SPSupplier);
  private industryService = inject(SPIndustry);
  private brandService = inject(SPBrand);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  addItem = output<ServiceOrderBatchRow>();

  readonly allBatches = toSignal(this.batchService.get(), { initialValue: [] });
  private readonly allProducts = toSignal(this.productService.get(), { initialValue: [] });
  private readonly allWarehouses = toSignal(this.warehouseService.get(), { initialValue: [] });
  private readonly allSuppliers = toSignal(this.supplierService.get(), { initialValue: [] });
  private readonly allIndustries = toSignal(this.industryService.get(), { initialValue: [] });
  private readonly allBrands = toSignal(this.brandService.get(), { initialValue: [] });

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
        const code = (b.code ?? '').toLowerCase();
        const brands = (b.compatible_brands ?? '').toLowerCase();
        const models = (b.compatible_models ?? '').toLowerCase();
        return (
          productName.includes(term) ||
          desc.includes(term) ||
          code.includes(term) ||
          brands.includes(term) ||
          models.includes(term)
        );
      })
      .slice(0, 8);
  });

  readonly form = new FormGroup({
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    quantity: new FormControl<number | null>(1, [Validators.required, Validators.min(1)]),
  });

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  selectBatch(batch: BatchWithRelations): void {
    this.form.patchValue({ price: batch.price ?? null, quantity: 1 });
    this.selectedBatch.set(batch);
    this.searchTerm.set('');
  }

  clearSelection(): void {
    this.form.patchValue({ price: null, quantity: 1 });
    this.selectedBatch.set(null);
    this.searchTerm.set('');
  }

  openNewBatchDialog(): void {
    const ref = this.dialog.open(BatchFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {
        products: this.allProducts(),
        warehouses: this.allWarehouses(),
        suppliers: this.allSuppliers(),
        industries: this.allIndustries(),
        brands: this.allBrands(),
      },
    });
    ref.afterClosed().subscribe((result: Batch | null) => {
      if (!result) return;
      this.batchService.add(result).subscribe({
        next: (saved) => {
          const newBatch = saved?.[0];
          if (!newBatch) return;
          const product = this.allProducts().find((p) => p.id === newBatch.product_id);
          const industry = this.allIndustries().find((i) => i.id === newBatch.industry_id);
          const warehouse = this.allWarehouses().find((w) => w.id === newBatch.warehouse_id);
          this.selectBatch({
            ...newBatch,
            product: product ? { name: product.name ?? '' } : null,
            industry: industry ? { name: industry.name ?? '' } : null,
            warehouse: warehouse ? { name: warehouse.name ?? '' } : null,
          });
        },
      });
    });
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
      quote_id: null,
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
