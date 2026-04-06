import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Animal } from '../../../core/models/animal.model';
import { ANIMAL_MOCK } from './animal.mock';
import { AnimalTable } from './components/animal-table/animal-table';
import { AnimalFormModal, AnimalFormData } from './components/animal-form-modal/animal-form-modal';
import { AnimalDetailModal } from './components/animal-detail-modal/animal-detail-modal';
import { AnimalDeleteConfirmModal } from './components/animal-delete-confirm-modal/animal-delete-confirm-modal';

@Component({
  selector: 'app-animal-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    AnimalTable,
  ],
  templateUrl: './animal-dashboard.html',
  styleUrl: './animal-dashboard.scss',
})
export class AnimalDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private animals = signal<Animal[]>(ANIMAL_MOCK);
  searchTerm = signal('');

  filteredAnimals = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.animals();
    return this.animals().filter(a =>
      a.tag.toLowerCase().includes(term) ||
      a.lotNumber.toLowerCase().includes(term) ||
      a.rancher.toLowerCase().includes(term) ||
      a.breed.toLowerCase().includes(term) ||
      a.pen.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(AnimalFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: {} satisfies AnimalFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newAnimal: Animal = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.animals.update(list => [newAnimal, ...list]);
      this.snackBar.open('Animal registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(animal: Animal): void {
    const ref = this.dialog.open(AnimalFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: { animal } satisfies AnimalFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.animals.update(list =>
        list.map(a => a.id === animal.id
          ? { ...a, ...result, updatedAt: new Date() }
          : a
        )
      );
      this.snackBar.open('Animal actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(animal: Animal): void {
    this.dialog.open(AnimalDetailModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: animal,
    });
  }

  onDelete(animal: Animal): void {
    const ref = this.dialog.open(AnimalDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: animal,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.animals.update(list => list.filter(a => a.id !== animal.id));
      this.snackBar.open('Animal eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
