import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Warehouse } from '../../../core/models/warehouse.model';
import { WAREHOUSE_MOCK } from './warehouse.mock';
import { WarehouseTable } from './components/warehouse-table/warehouse-table';
import {
  WarehouseFormModal,
  WarehouseFormData,
} from './components/warehouse-form-modal/warehouse-form-modal';
import { WarehouseDetailModal } from './components/warehouse-detail-modal/warehouse-detail-modal';
import { WarehouseDeleteConfirmModal } from './components/warehouse-delete-confirm-modal/warehouse-delete-confirm-modal';

@Component({
  selector: 'app-warehouse-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    WarehouseTable,
  ],
  templateUrl: './warehouse-dashboard.html',
  styleUrl: './warehouse-dashboard.scss',
})
export class WarehouseDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private warehouses = signal<Warehouse[]>(WAREHOUSE_MOCK);
  searchTerm = signal('');

  filteredWarehouses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.warehouses();
    return this.warehouses().filter(w =>
      w.name.toLowerCase().includes(term) ||
      (w.description ?? '').toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(WarehouseFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies WarehouseFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newWarehouse: Warehouse = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.warehouses.update(list => [newWarehouse, ...list]);
      this.snackBar.open('Almacén registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(warehouse: Warehouse): void {
    const ref = this.dialog.open(WarehouseFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { warehouse } satisfies WarehouseFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.warehouses.update(list =>
        list.map(w => w.id === warehouse.id
          ? { ...w, ...result, updatedAt: new Date() }
          : w
        )
      );
      this.snackBar.open('Almacén actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(warehouse: Warehouse): void {
    this.dialog.open(WarehouseDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: warehouse,
    });
  }

  onDelete(warehouse: Warehouse): void {
    const ref = this.dialog.open(WarehouseDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: warehouse,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.warehouses.update(list => list.filter(w => w.id !== warehouse.id));
      this.snackBar.open('Almacén eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
