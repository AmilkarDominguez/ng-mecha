import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Carrier } from '../../../core/models/carrier.model';
import { CARRIER_MOCK } from './carrier.mock';
import { CarrierTable } from './components/carrier-table/carrier-table';
import { CarrierFormModal, CarrierFormData } from './components/carrier-form-modal/carrier-form-modal';
import { CarrierDetailModal } from './components/carrier-detail-modal/carrier-detail-modal';
import { CarrierDeleteConfirmModal } from './components/carrier-delete-confirm-modal/carrier-delete-confirm-modal';

@Component({
  selector: 'app-carrier-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CarrierTable,
  ],
  templateUrl: './carrier-dashboard.html',
  styleUrl: './carrier-dashboard.scss',
})
export class CarrierDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private carriers = signal<Carrier[]>(CARRIER_MOCK);
  searchTerm = signal('');

  filteredCarriers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.carriers();
    return this.carriers().filter(c =>
      c.businessName.toLowerCase().includes(term) ||
      c.taxId.toLowerCase().includes(term) ||
      c.vehiclePlate.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(CarrierFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: {} satisfies CarrierFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newCarrier: Carrier = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carriers.update(list => [newCarrier, ...list]);
      this.snackBar.open('Transportista registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(carrier: Carrier): void {
    const ref = this.dialog.open(CarrierFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: { carrier } satisfies CarrierFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.carriers.update(list =>
        list.map(c => c.id === carrier.id
          ? { ...c, ...result, updatedAt: new Date() }
          : c
        )
      );
      this.snackBar.open('Transportista actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(carrier: Carrier): void {
    this.dialog.open(CarrierDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: carrier,
    });
  }

  onDelete(carrier: Carrier): void {
    const ref = this.dialog.open(CarrierDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: carrier,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.carriers.update(list => list.filter(c => c.id !== carrier.id));
      this.snackBar.open('Transportista eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
