import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Gender } from '../../../core/models/gender.model';
import { GENDER_MOCK } from './gender.mock';
import { GenderTable } from './components/gender-table/gender-table';
import { GenderFormModal, GenderFormData } from './components/gender-form-modal/gender-form-modal';
import { GenderDetailModal } from './components/gender-detail-modal/gender-detail-modal';
import { GenderDeleteConfirmModal } from './components/gender-delete-confirm-modal/gender-delete-confirm-modal';

@Component({
  selector: 'app-gender-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    GenderTable,
  ],
  templateUrl: './gender-dashboard.html',
  styleUrl: './gender-dashboard.scss',
})
export class GenderDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private genders = signal<Gender[]>(GENDER_MOCK);
  searchTerm = signal('');

  filteredGenders = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.genders();
    return this.genders().filter(g =>
      g.name.toLowerCase().includes(term) ||
      g.code.toLowerCase().includes(term) ||
      g.description.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(GenderFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies GenderFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newGender: Gender = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.genders.update(list => [newGender, ...list]);
      this.snackBar.open('Sexo registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(gender: Gender): void {
    const ref = this.dialog.open(GenderFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { gender } satisfies GenderFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.genders.update(list =>
        list.map(g => g.id === gender.id
          ? { ...g, ...result, updatedAt: new Date() }
          : g
        )
      );
      this.snackBar.open('Sexo actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(gender: Gender): void {
    this.dialog.open(GenderDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: gender,
    });
  }

  onDelete(gender: Gender): void {
    const ref = this.dialog.open(GenderDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: gender,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.genders.update(list => list.filter(g => g.id !== gender.id));
      this.snackBar.open('Sexo eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
