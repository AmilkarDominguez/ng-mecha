import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Batch } from '../../../core/models/batch.model';
import { Product } from '../../../core/models/product.model';
import { Warehouse } from '../../../core/models/warehouse.model';
import { Supplier } from '../../../core/models/supplier.model';
import { Industry } from '../../../core/models/industry.model';
import { Brand } from '../../../core/models/brand.model';
import { BATCH_MOCK } from './batch.mock';
import { PRODUCT_MOCK } from '../product/product.mock';
import { WAREHOUSE_MOCK } from '../warehouses/warehouse.mock';
import { SUPPLIER_MOCK } from '../supplier/supplier.mock';
import { INDUSTRY_MOCK } from '../industry/industry.mock';
import { BRAND_MOCK } from '../brand/brand.mock';
import { BatchTable } from './components/batch-table/batch-table';
import {
  BatchFormModal,
  BatchFormData,
} from './components/batch-form-modal/batch-form-modal';
import { BatchDetailModal, BatchDetailData } from './components/batch-detail-modal/batch-detail-modal';
import { BatchDeleteConfirmModal } from './components/batch-delete-confirm-modal/batch-delete-confirm-modal';

@Component({
  selector: 'app-batch-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    BatchTable,
  ],
  templateUrl: './batch-dashboard.html',
  styleUrl: './batch-dashboard.scss',
})
export class BatchDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private batches = signal<Batch[]>(BATCH_MOCK);
  readonly products: Product[] = PRODUCT_MOCK;
  readonly warehouses: Warehouse[] = WAREHOUSE_MOCK;
  readonly suppliers: Supplier[] = SUPPLIER_MOCK;
  readonly industries: Industry[] = INDUSTRY_MOCK;
  readonly brands: Brand[] = BRAND_MOCK;

  searchTerm = signal('');

  filteredBatches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.batches();
    return this.batches().filter(b => {
      const product = this.products.find(p => p.id === b.productId);
      const warehouse = this.warehouses.find(w => w.id === b.warehouseId);
      return (
        (b.code ?? '').toLowerCase().includes(term) ||
        (b.brand ?? '').toLowerCase().includes(term) ||
        (b.model ?? '').toLowerCase().includes(term) ||
        (b.description ?? '').toLowerCase().includes(term) ||
        (product?.name ?? '').toLowerCase().includes(term) ||
        (warehouse?.name ?? '').toLowerCase().includes(term)
      );
    });
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(BatchFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: {
        products: this.products,
        warehouses: this.warehouses,
        suppliers: this.suppliers,
        industries: this.industries,
        brands: this.brands,
      } satisfies BatchFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newBatch: Batch = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.batches.update(list => [newBatch, ...list]);
      this.snackBar.open('Lote registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(batch: Batch): void {
    const ref = this.dialog.open(BatchFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: {
        batch,
        products: this.products,
        warehouses: this.warehouses,
        suppliers: this.suppliers,
        industries: this.industries,
        brands: this.brands,
      } satisfies BatchFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.batches.update(list =>
        list.map(b => b.id === batch.id
          ? { ...b, ...result, updatedAt: new Date() }
          : b
        )
      );
      this.snackBar.open('Lote actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(batch: Batch): void {
    this.dialog.open(BatchDetailModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: {
        batch,
        products: this.products,
        warehouses: this.warehouses,
        suppliers: this.suppliers,
        industries: this.industries,
        brands: this.brands,
      } satisfies BatchDetailData,
    });
  }

  onDelete(batch: Batch): void {
    const ref = this.dialog.open(BatchDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: batch,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.batches.update(list => list.filter(b => b.id !== batch.id));
      this.snackBar.open('Lote eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
