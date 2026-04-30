import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Service } from '../../../core/models/service.model';
import { SPService } from '../../../core/services/supabase/sb-service';
import { ServiceTable } from './components/service-table/service-table';
import {
  ServiceFormModal,
  ServiceFormData,
} from './components/service-form-modal/service-form-modal';
import { ServiceDetailModal } from './components/service-detail-modal/service-detail-modal';
import { ServiceDeleteConfirmModal } from './components/service-delete-confirm-modal/service-delete-confirm-modal';

@Component({
  selector: 'app-service-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ServiceTable,
  ],
  templateUrl: './service-dashboard.html',
  styleUrl: './service-dashboard.scss',
})
export class ServiceDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private spService = inject(SPService);

  readonly services = toSignal(this.spService.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredServices = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.services();
    return this.services().filter(
      (s) =>
        (s.name ?? '').toLowerCase().includes(term) ||
        (s.code ?? '').toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ServiceFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies ServiceFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newService: Service = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.spService.add(newService).subscribe(() => {
        this.snackBar.open('Servicio registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(item: Service): void {
    const ref = this.dialog.open(ServiceFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { service: item } satisfies ServiceFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.spService.update({ ...result, id: item.id }).subscribe(() => {
        this.snackBar.open('Servicio actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(item: Service): void {
    this.dialog.open(ServiceDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: item,
    });
  }

  onDelete(item: Service): void {
    const ref = this.dialog.open(ServiceDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: item,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.spService.delete(item.id).subscribe(() => {
        this.snackBar.open('Servicio eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
