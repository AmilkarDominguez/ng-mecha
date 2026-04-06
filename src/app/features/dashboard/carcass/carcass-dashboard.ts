import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Carcass } from '../../../core/models/carcass.model';
import { CARCASS_MOCK } from './carcass.mock';
import { CarcassTable } from './components/carcass-table/carcass-table';
import { CarcassFormModal, CarcassFormData } from './components/carcass-form-modal/carcass-form-modal';
import { CarcassDetailModal } from './components/carcass-detail-modal/carcass-detail-modal';
import { CarcassDeleteConfirmModal } from './components/carcass-delete-confirm-modal/carcass-delete-confirm-modal';

@Component({
  selector: 'app-carcass-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CarcassTable,
  ],
  templateUrl: './carcass-dashboard.html',
  styleUrl: './carcass-dashboard.scss',
})
export class CarcassDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private carcasses = signal<Carcass[]>(CARCASS_MOCK);
  searchTerm = signal('');

  filteredCarcasses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.carcasses();
    return this.carcasses().filter(c =>
      c.carcassCode.toLowerCase().includes(term) ||
      c.animalTag.toLowerCase().includes(term) ||
      c.lotNumber.toLowerCase().includes(term) ||
      c.rancher.toLowerCase().includes(term) ||
      c.label2Code.toLowerCase().includes(term) ||
      c.coldRoomAssigned.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(CarcassFormModal, {
      width: '56rem',
      maxWidth: '95vw',
      data: {} satisfies CarcassFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newCarcass: Carcass = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carcasses.update(list => [newCarcass, ...list]);
      this.snackBar.open('Canal registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(carcass: Carcass): void {
    const ref = this.dialog.open(CarcassFormModal, {
      width: '56rem',
      maxWidth: '95vw',
      data: { carcass } satisfies CarcassFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.carcasses.update(list =>
        list.map(c => c.id === carcass.id
          ? { ...c, ...result, updatedAt: new Date() }
          : c
        )
      );
      this.snackBar.open('Canal actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(carcass: Carcass): void {
    this.dialog.open(CarcassDetailModal, {
      width: '50rem',
      maxWidth: '95vw',
      data: carcass,
    });
  }

  onDelete(carcass: Carcass): void {
    const ref = this.dialog.open(CarcassDeleteConfirmModal, {
      width: '30rem',
      maxWidth: '95vw',
      data: carcass,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.carcasses.update(list => list.filter(c => c.id !== carcass.id));
      this.snackBar.open('Canal eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}
