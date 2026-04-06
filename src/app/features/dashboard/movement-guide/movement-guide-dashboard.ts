import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MovementGuide } from '../../../core/models/movement-guide.model';
import { MOVEMENT_GUIDE_MOCK } from './movement-guide.mock';
import { MovementGuideTable } from './components/movement-guide-table/movement-guide-table';
import { MovementGuideFormModal, MovementGuideFormData } from './components/movement-guide-form-modal/movement-guide-form-modal';
import { MovementGuideDetailModal } from './components/movement-guide-detail-modal/movement-guide-detail-modal';
import { MovementGuideDeleteConfirmModal } from './components/movement-guide-delete-confirm-modal/movement-guide-delete-confirm-modal';

@Component({
  selector: 'app-movement-guide-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MovementGuideTable,
  ],
  templateUrl: './movement-guide-dashboard.html',
  styleUrl: './movement-guide-dashboard.scss',
})
export class MovementGuideDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private guides = signal<MovementGuide[]>(MOVEMENT_GUIDE_MOCK);
  searchTerm = signal('');

  filteredGuides = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.guides();
    return this.guides().filter(g =>
      g.guideNumber.toLowerCase().includes(term) ||
      g.rancher.toLowerCase().includes(term) ||
      g.carrier.toLowerCase().includes(term) ||
      g.vehiclePlate.toLowerCase().includes(term) ||
      g.status.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(MovementGuideFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: {} satisfies MovementGuideFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newGuide: MovementGuide = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.guides.update(list => [newGuide, ...list]);
      this.snackBar.open('Guía de movimiento registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(guide: MovementGuide): void {
    const ref = this.dialog.open(MovementGuideFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: { guide } satisfies MovementGuideFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.guides.update(list =>
        list.map(g => g.id === guide.id
          ? { ...g, ...result, updatedAt: new Date() }
          : g
        )
      );
      this.snackBar.open('Guía actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(guide: MovementGuide): void {
    this.dialog.open(MovementGuideDetailModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: guide,
    });
  }

  onDelete(guide: MovementGuide): void {
    const ref = this.dialog.open(MovementGuideDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: guide,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.guides.update(list => list.filter(g => g.id !== guide.id));
      this.snackBar.open('Guía eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}
