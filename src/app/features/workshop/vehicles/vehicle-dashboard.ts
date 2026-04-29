import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Vehicle } from '../../../core/models/vehicle.model';
import { SPVehicle } from '../../../core/services/supabase/sb-vehicles';
import { VehicleTable } from './components/vehicle-table/vehicle-table';
import {
  VehicleFormModal,
  VehicleFormData,
} from './components/vehicle-form-modal/vehicle-form-modal';
import { VehicleDetailModal } from './components/vehicle-detail-modal/vehicle-detail-modal';
import { VehicleDeleteConfirmModal } from './components/vehicle-delete-confirm-modal/vehicle-delete-confirm-modal';

@Component({
  selector: 'app-vehicle-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    VehicleTable,
  ],
  templateUrl: './vehicle-dashboard.html',
  styleUrl: './vehicle-dashboard.scss',
})
export class VehicleDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPVehicle);

  readonly vehicles = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredVehicles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.vehicles();
    return this.vehicles().filter(
      (v) =>
        (v.license_plate ?? '').toLowerCase().includes(term) ||
        (v.brand ?? '').toLowerCase().includes(term) ||
        (v.model ?? '').toLowerCase().includes(term) ||
        (v.year ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(VehicleFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: {} satisfies VehicleFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newVehicle: Vehicle = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newVehicle).subscribe(() => {
        this.snackBar.open('Vehículo registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(vehicle: Vehicle): void {
    const ref = this.dialog.open(VehicleFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: { vehicle } satisfies VehicleFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.service.update({ ...result, id: vehicle.id }).subscribe(() => {
        this.snackBar.open('Vehículo actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(vehicle: Vehicle): void {
    this.dialog.open(VehicleDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: vehicle,
    });
  }

  onDelete(vehicle: Vehicle): void {
    const ref = this.dialog.open(VehicleDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: vehicle,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.delete(vehicle.id).subscribe(() => {
        this.snackBar.open('Vehículo eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
