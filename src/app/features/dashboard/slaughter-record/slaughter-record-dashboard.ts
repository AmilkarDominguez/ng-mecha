import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SlaughterRecord } from '../../../core/models/slaughter-record.model';
import { SLAUGHTER_RECORD_MOCK } from './slaughter-record.mock';
import { SlaughterRecordTable } from './components/slaughter-record-table/slaughter-record-table';
import { SlaughterRecordFormModal, SlaughterRecordFormData } from './components/slaughter-record-form-modal/slaughter-record-form-modal';
import { SlaughterRecordDetailModal } from './components/slaughter-record-detail-modal/slaughter-record-detail-modal';
import { SlaughterRecordDeleteConfirmModal } from './components/slaughter-record-delete-confirm-modal/slaughter-record-delete-confirm-modal';

@Component({
  selector: 'app-slaughter-record-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    SlaughterRecordTable,
  ],
  templateUrl: './slaughter-record-dashboard.html',
  styleUrl: './slaughter-record-dashboard.scss',
})
export class SlaughterRecordDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private records = signal<SlaughterRecord[]>(SLAUGHTER_RECORD_MOCK);
  searchTerm = signal('');

  filteredRecords = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.records();
    return this.records().filter(r =>
      r.recordNumber.toLowerCase().includes(term) ||
      r.animalTag.toLowerCase().includes(term) ||
      r.lotNumber.toLowerCase().includes(term) ||
      r.rancher.toLowerCase().includes(term) ||
      r.operator.toLowerCase().includes(term) ||
      r.label2Code.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(SlaughterRecordFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: {} satisfies SlaughterRecordFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newRecord: SlaughterRecord = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.records.update(list => [newRecord, ...list]);
      this.snackBar.open('Registro de faena creado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(record: SlaughterRecord): void {
    const ref = this.dialog.open(SlaughterRecordFormModal, {
      width: '52rem',
      maxWidth: '95vw',
      data: { record } satisfies SlaughterRecordFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.records.update(list =>
        list.map(r => r.id === record.id
          ? { ...r, ...result, updatedAt: new Date() }
          : r
        )
      );
      this.snackBar.open('Registro de faena actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(record: SlaughterRecord): void {
    this.dialog.open(SlaughterRecordDetailModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: record,
    });
  }

  onDelete(record: SlaughterRecord): void {
    const ref = this.dialog.open(SlaughterRecordDeleteConfirmModal, {
      width: '30rem',
      maxWidth: '95vw',
      data: record,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.records.update(list => list.filter(r => r.id !== record.id));
      this.snackBar.open('Registro de faena eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
