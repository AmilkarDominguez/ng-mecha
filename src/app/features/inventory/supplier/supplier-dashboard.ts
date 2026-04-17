import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Supplier } from '../../../core/models/supplier.model';
import { SPSupplier } from '../../../core/services/supabase/sb-supplier';
import { SupplierTable } from './components/supplier-table/supplier-table';
import { SupplierFormModal, SupplierFormData } from './components/supplier-form-modal/supplier-form-modal';
import { SupplierDetailModal } from './components/supplier-detail-modal/supplier-detail-modal';
import { SupplierDeleteConfirmModal } from './components/supplier-delete-confirm-modal/supplier-delete-confirm-modal';

@Component({
  selector: 'app-supplier-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    SupplierTable,
  ],
  templateUrl: './supplier-dashboard.html',
  styleUrl: './supplier-dashboard.scss',
})
export class SupplierDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPSupplier);

  readonly suppliers = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredSuppliers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.suppliers();
    return this.suppliers().filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.email ?? '').toLowerCase().includes(term) ||
        (s.address ?? '').toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(SupplierFormModal, {
      width: '44rem',
      maxWidth: '95vw',
      data: {} satisfies SupplierFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newSupplier: Supplier = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newSupplier).subscribe(() => {
        this.snackBar.open('Proveedor registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(supplier: Supplier): void {
    const ref = this.dialog.open(SupplierFormModal, {
      width: '44rem',
      maxWidth: '95vw',
      data: { supplier } satisfies SupplierFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: supplier.id }).subscribe(() => {
        this.snackBar.open('Proveedor actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(supplier: Supplier): void {
    this.dialog.open(SupplierDetailModal, {
      width: '40rem',
      maxWidth: '95vw',
      data: supplier,
    });
  }

  onDelete(supplier: Supplier): void {
    const ref = this.dialog.open(SupplierDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: supplier,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(supplier.id).subscribe(() => {
        this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
