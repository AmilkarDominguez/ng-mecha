import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Mechanic } from '../../../core/models/mechanic.model';
import { SPMechanic } from '../../../core/services/supabase/sb-mechanic';
import { MechanicTable } from './components/mechanic-table/mechanic-table';
import {
  MechanicFormModal,
  MechanicFormData,
} from './components/mechanic-form-modal/mechanic-form-modal';
import { MechanicDetailModal } from './components/mechanic-detail-modal/mechanic-detail-modal';
import { MechanicDeleteConfirmModal } from './components/mechanic-delete-confirm-modal/mechanic-delete-confirm-modal';

@Component({
  selector: 'app-mechanic-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MechanicTable,
  ],
  templateUrl: './mechanic-dashboard.html',
  styleUrl: './mechanic-dashboard.scss',
})
export class MechanicDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPMechanic);

  readonly mechanics = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredMechanics = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.mechanics();
    return this.mechanics().filter(
      (m) =>
        (m.name ?? '').toLowerCase().includes(term) ||
        (m.lastname ?? '').toLowerCase().includes(term) ||
        (m.ci ?? '').toLowerCase().includes(term) ||
        (m.email ?? '').toLowerCase().includes(term) ||
        (m.phone ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(MechanicFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: {} satisfies MechanicFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newMechanic: Mechanic = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newMechanic).subscribe(() => {
        this.snackBar.open('Mecánico registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(mechanic: Mechanic): void {
    const ref = this.dialog.open(MechanicFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: { mechanic } satisfies MechanicFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: mechanic.id }).subscribe(() => {
        this.snackBar.open('Mecánico actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(mechanic: Mechanic): void {
    this.dialog.open(MechanicDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: mechanic,
    });
  }

  onDelete(mechanic: Mechanic): void {
    const ref = this.dialog.open(MechanicDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: mechanic,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(mechanic.id).subscribe(() => {
        this.snackBar.open('Mecánico eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
