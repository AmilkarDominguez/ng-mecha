import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExternalService } from '../../../core/models/external-service.model';
import { SPExternalService } from '../../../core/services/supabase/sb-external-service';
import { ExternalServiceTable } from './components/external-service-table/external-service-table';
import {
  ExternalServiceFormModal,
  ExternalServiceFormData,
} from './components/external-service-form-modal/external-service-form-modal';
import { ExternalServiceDetailModal } from './components/external-service-detail-modal/external-service-detail-modal';
import { ExternalServiceDeleteConfirmModal } from './components/external-service-delete-confirm-modal/external-service-delete-confirm-modal';

@Component({
  selector: 'app-external-service-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ExternalServiceTable,
  ],
  templateUrl: './external-service-dashboard.html',
  styleUrl: './external-service-dashboard.scss',
})
export class ExternalServiceDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPExternalService);

  readonly externalServices = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredExternalServices = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.externalServices();
    return this.externalServices().filter(
      (s) =>
        (s.name ?? '').toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ExternalServiceFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies ExternalServiceFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newItem: ExternalService = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newItem).subscribe(() => {
        this.snackBar.open('Servicio externo registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(item: ExternalService): void {
    const ref = this.dialog.open(ExternalServiceFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { externalService: item } satisfies ExternalServiceFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: item.id }).subscribe(() => {
        this.snackBar.open('Servicio externo actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(item: ExternalService): void {
    this.dialog.open(ExternalServiceDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: item,
    });
  }

  onDelete(item: ExternalService): void {
    const ref = this.dialog.open(ExternalServiceDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: item,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(item.id).subscribe(() => {
        this.snackBar.open('Servicio externo eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
