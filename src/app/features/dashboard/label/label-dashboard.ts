import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Label } from '../../../core/models/label.model';
import { LABEL_MOCK } from './label.mock';
import { LabelTable } from './components/label-table/label-table';
import { LabelFormModal, LabelFormData } from './components/label-form-modal/label-form-modal';
import { LabelDetailModal } from './components/label-detail-modal/label-detail-modal';
import { LabelDeleteConfirmModal } from './components/label-delete-confirm-modal/label-delete-confirm-modal';
import { LabelPrintModal } from './components/label-print-modal/label-print-modal';

@Component({
  selector: 'app-label-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    LabelTable,
  ],
  templateUrl: './label-dashboard.html',
  styleUrl: './label-dashboard.scss',
})
export class LabelDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private labels = signal<Label[]>(LABEL_MOCK);
  searchTerm = signal('');

  filteredLabels = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.labels();
    return this.labels().filter(l =>
      l.labelCode.toLowerCase().includes(term) ||
      l.animalTag.toLowerCase().includes(term) ||
      l.carcassCode.toLowerCase().includes(term) ||
      l.lotNumber.toLowerCase().includes(term) ||
      l.rancher.toLowerCase().includes(term) ||
      l.printedBy.toLowerCase().includes(term) ||
      l.destination.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(LabelFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: {} satisfies LabelFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newLabel: Label = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.labels.update(list => [newLabel, ...list]);
      this.snackBar.open('Etiqueta registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(label: Label): void {
    const ref = this.dialog.open(LabelFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: { label } satisfies LabelFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.labels.update(list =>
        list.map(l => l.id === label.id
          ? { ...l, ...result, updatedAt: new Date() }
          : l
        )
      );
      this.snackBar.open('Etiqueta actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(label: Label): void {
    this.dialog.open(LabelDetailModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: label,
    });
  }

  onDelete(label: Label): void {
    const ref = this.dialog.open(LabelDeleteConfirmModal, {
      width: '30rem',
      maxWidth: '95vw',
      data: label,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.labels.update(list => list.filter(l => l.id !== label.id));
      this.snackBar.open('Etiqueta eliminada', 'Cerrar', { duration: 3000 });
    });
  }

  onPrint(label: Label): void {
    this.dialog.open(LabelPrintModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: label,
    });
  }
}
