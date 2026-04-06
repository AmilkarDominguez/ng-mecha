import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Breed } from '../../../core/models/breed.model';
import { BREED_MOCK } from './breed.mock';
import { BreedTable } from './components/breed-table/breed-table';
import { BreedFormModal, BreedFormData } from './components/breed-form-modal/breed-form-modal';
import { BreedDetailModal } from './components/breed-detail-modal/breed-detail-modal';
import { BreedDeleteConfirmModal } from './components/breed-delete-confirm-modal/breed-delete-confirm-modal';

@Component({
  selector: 'app-breed-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    BreedTable,
  ],
  templateUrl: './breed-dashboard.html',
  styleUrl: './breed-dashboard.scss',
})
export class BreedDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private breeds = signal<Breed[]>(BREED_MOCK);
  searchTerm = signal('');

  filteredBreeds = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.breeds();
    return this.breeds().filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.origin.toLowerCase().includes(term) ||
      b.description.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(BreedFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: {} satisfies BreedFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newBreed: Breed = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.breeds.update(list => [newBreed, ...list]);
      this.snackBar.open('Raza registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(breed: Breed): void {
    const ref = this.dialog.open(BreedFormModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: { breed } satisfies BreedFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.breeds.update(list =>
        list.map(b => b.id === breed.id
          ? { ...b, ...result, updatedAt: new Date() }
          : b
        )
      );
      this.snackBar.open('Raza actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(breed: Breed): void {
    this.dialog.open(BreedDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: breed,
    });
  }

  onDelete(breed: Breed): void {
    const ref = this.dialog.open(BreedDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: breed,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.breeds.update(list => list.filter(b => b.id !== breed.id));
      this.snackBar.open('Raza eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}
