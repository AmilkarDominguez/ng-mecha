import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Pen } from '../../../core/models/pen.model';
import { PEN_MOCK } from './pen.mock';
import { PenTable } from './components/pen-table/pen-table';
import { PenFormModal, PenFormData } from './components/pen-form-modal/pen-form-modal';
import { PenDetailModal } from './components/pen-detail-modal/pen-detail-modal';
import { PenDeleteConfirmModal } from './components/pen-delete-confirm-modal/pen-delete-confirm-modal';

@Component({
  selector: 'app-pen-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    PenTable,
  ],
  templateUrl: './pen-dashboard.html',
  styleUrl: './pen-dashboard.scss',
})
export class PenDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private pens = signal<Pen[]>(PEN_MOCK);
  searchTerm = signal('');

  filteredPens = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.pens();
    return this.pens().filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(PenFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: {} satisfies PenFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newPen: Pen = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.pens.update(list => [newPen, ...list]);
      this.snackBar.open('Corral registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(pen: Pen): void {
    const ref = this.dialog.open(PenFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: { pen } satisfies PenFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.pens.update(list =>
        list.map(p => p.id === pen.id
          ? { ...p, ...result, updatedAt: new Date() }
          : p
        )
      );
      this.snackBar.open('Corral actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(pen: Pen): void {
    this.dialog.open(PenDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: pen,
    });
  }

  onDelete(pen: Pen): void {
    const ref = this.dialog.open(PenDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: pen,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.pens.update(list => list.filter(p => p.id !== pen.id));
      this.snackBar.open('Corral eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
