import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Batch } from '../../../core/models/batch.model';
import { SPBatch } from '../../../core/services/supabase/sb-batch';
import { SPBatchPurchase } from '../../../core/services/supabase/sb-batch-purchase';
import { SPProduct } from '../../../core/services/supabase/sb-product';
import { SPWarehouse } from '../../../core/services/supabase/sb-warehouse';
import { SPSupplier } from '../../../core/services/supabase/sb-supplier';
import { SPIndustry } from '../../../core/services/supabase/sb-industry';
import { SPBrand } from '../../../core/services/supabase/sb-brand';
import { AuthService } from '../../../core/auth/services/auth.service';
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
  private service = inject(SPBatch);
  private batchPurchaseService = inject(SPBatchPurchase);
  private auth = inject(AuthService);

  readonly batches = toSignal(this.service.listen(), { initialValue: [] });
  readonly products = toSignal(inject(SPProduct).listen(), { initialValue: [] });
  readonly warehouses = toSignal(inject(SPWarehouse).listen(), { initialValue: [] });
  readonly suppliers = toSignal(inject(SPSupplier).listen(), { initialValue: [] });
  readonly industries = toSignal(inject(SPIndustry).listen(), { initialValue: [] });
  readonly brands = toSignal(inject(SPBrand).listen(), { initialValue: [] });

  readonly searchTerm = signal('');

  readonly filteredBatches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.batches();
    return this.batches().filter((b) => {
      const product = this.products().find((p) => p.id === b.product_id);
      const warehouse = this.warehouses().find((w) => w.id === b.warehouse_id);
      return (
        (b.code ?? '').toLowerCase().includes(term) ||
        (b.compatible_brands ?? '').toLowerCase().includes(term) ||
        (b.compatible_models ?? '').toLowerCase().includes(term) ||
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
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {
        products: this.products(),
        warehouses: this.warehouses(),
        suppliers: this.suppliers(),
        industries: this.industries(),
        brands: this.brands(),
      } satisfies BatchFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newBatch: Batch = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newBatch).subscribe({
        next: (data) => {
          this.snackBar.open('Lote registrado correctamente', 'Cerrar', { duration: 3000 });
          const created = data[0];
          if (created && newBatch.bank_account_id) {
            this.batchPurchaseService
              .apply({
                batchId: created.id,
                bankAccountId: newBatch.bank_account_id,
                cost: created.cost,
                stock: created.stock,
                code: created.code,
                userId: this.auth.currentUser()?.id ?? null,
              })
              .subscribe({
                error: (err) => {
                  this.snackBar.open(
                    err?.message ?? 'Lote registrado, pero no se pudo registrar la compra en la cuenta bancaria',
                    'Cerrar',
                    { duration: 5000 },
                  );
                },
              });
          }
        },
        error: () => {
          this.snackBar.open('Error al registrar el lote', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }

  onEdit(batch: Batch): void {
    const ref = this.dialog.open(BatchFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {
        batch,
        products: this.products(),
        warehouses: this.warehouses(),
        suppliers: this.suppliers(),
        industries: this.industries(),
        brands: this.brands(),
      } satisfies BatchFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: batch.id }).subscribe({
        next: () => {
          this.snackBar.open('Lote actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.batchPurchaseService
            .reconcile({
              batchId: batch.id,
              bankAccountId: result.bank_account_id ?? null,
              cost: result.cost,
              stock: result.stock,
              code: result.code,
              userId: this.auth.currentUser()?.id ?? null,
            })
            .subscribe({
              error: (err) => {
                this.snackBar.open(
                  err?.message ?? 'Lote actualizado, pero no se pudo ajustar el movimiento bancario',
                  'Cerrar',
                  { duration: 5000 },
                );
              },
            });
        },
        error: () => {
          this.snackBar.open('Error al actualizar el lote', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }

  onView(batch: Batch): void {
    this.dialog.open(BatchDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {
        batch,
        products: this.products(),
        warehouses: this.warehouses(),
        suppliers: this.suppliers(),
        industries: this.industries(),
        brands: this.brands(),
      } satisfies BatchDetailData,
    });
  }

  onDelete(batch: Batch): void {
    const ref = this.dialog.open(BatchDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: batch,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.batchPurchaseService.reverse(batch.id).subscribe({
        next: () => {
          this.service.delete(batch.id).subscribe(() => {
            this.snackBar.open('Lote eliminado', 'Cerrar', { duration: 3000 });
          });
        },
        error: (err) => {
          this.snackBar.open(
            err?.message ?? 'No se pudo revertir el movimiento bancario del lote; no se eliminó.',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
    });
  }
}
