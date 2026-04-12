import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Supplier } from '../../../core/models/supplier.model';
import { SUPPLIER_MOCK } from './supplier.mock';
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

  private suppliers = signal<Supplier[]>(SUPPLIER_MOCK);
  searchTerm = signal('');

  filteredSuppliers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.suppliers();
    return this.suppliers().filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.email ?? '').toLowerCase().includes(term) ||
      (s.address ?? '').toLowerCase().includes(term) ||
      (s.description ?? '').toLowerCase().includes(term)
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

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newSupplier: Supplier = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.suppliers.update(list => [newSupplier, ...list]);
      this.snackBar.open('Proveedor registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(supplier: Supplier): void {
    const ref = this.dialog.open(SupplierFormModal, {
      width: '44rem',
      maxWidth: '95vw',
      data: { supplier } satisfies SupplierFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.suppliers.update(list =>
        list.map(s => s.id === supplier.id
          ? { ...s, ...result, updatedAt: new Date() }
          : s
        )
      );
      this.snackBar.open('Proveedor actualizado correctamente', 'Cerrar', { duration: 3000 });
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

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.suppliers.update(list => list.filter(s => s.id !== supplier.id));
      this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
