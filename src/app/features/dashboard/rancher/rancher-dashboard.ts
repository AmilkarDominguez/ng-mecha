import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Rancher } from '../../../core/models/rancher.model';
import { RANCHER_MOCK } from './rancher.mock';
import { RancherTable } from './components/rancher-table/rancher-table';
import { RancherFormModal, RancherFormData } from './components/rancher-form-modal/rancher-form-modal';
import { RancherDetailModal } from './components/rancher-detail-modal/rancher-detail-modal';
import { RancherDeleteConfirmModal } from './components/rancher-delete-confirm-modal/rancher-delete-confirm-modal';

@Component({
  selector: 'app-rancher-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RancherTable,
  ],
  templateUrl: './rancher-dashboard.html',
  styleUrl: './rancher-dashboard.scss',
})
export class RancherDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private ranchers = signal<Rancher[]>(RANCHER_MOCK);
  searchTerm = signal('');

  filteredRanchers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.ranchers();
    return this.ranchers().filter(r =>
      r.businessName.toLowerCase().includes(term) ||
      r.taxId.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.phone.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(RancherFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies RancherFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newRancher: Rancher = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.ranchers.update(list => [newRancher, ...list]);
      this.snackBar.open('Ganadero registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(rancher: Rancher): void {
    const ref = this.dialog.open(RancherFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { rancher } satisfies RancherFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.ranchers.update(list =>
        list.map(r => r.id === rancher.id
          ? { ...r, ...result, updatedAt: new Date() }
          : r
        )
      );
      this.snackBar.open('Ganadero actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(rancher: Rancher): void {
    this.dialog.open(RancherDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: rancher,
    });
  }

  onDelete(rancher: Rancher): void {
    const ref = this.dialog.open(RancherDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: rancher,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.ranchers.update(list => list.filter(r => r.id !== rancher.id));
      this.snackBar.open('Ganadero eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
