import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ColdRoom } from '../../../core/models/coldroom.model';
import { COLDROOM_MOCK } from './coldroom.mock';
import { ColdRoomTable } from './components/coldroom-table/coldroom-table';
import { ColdRoomFormModal, ColdRoomFormData } from './components/coldroom-form-modal/coldroom-form-modal';
import { ColdRoomDetailModal } from './components/coldroom-detail-modal/coldroom-detail-modal';
import { ColdRoomDeleteConfirmModal } from './components/coldroom-delete-confirm-modal/coldroom-delete-confirm-modal';

@Component({
  selector: 'app-coldroom-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ColdRoomTable,
  ],
  templateUrl: './coldroom-dashboard.html',
  styleUrl: './coldroom-dashboard.scss',
})
export class ColdRoomDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private coldRooms = signal<ColdRoom[]>(COLDROOM_MOCK);
  searchTerm = signal('');

  filteredColdRooms = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.coldRooms();
    return this.coldRooms().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.location.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ColdRoomFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: {} satisfies ColdRoomFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newColdRoom: ColdRoom = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.coldRooms.update(list => [newColdRoom, ...list]);
      this.snackBar.open('Cámara registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(coldRoom: ColdRoom): void {
    const ref = this.dialog.open(ColdRoomFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: { coldRoom } satisfies ColdRoomFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.coldRooms.update(list =>
        list.map(c => c.id === coldRoom.id
          ? { ...c, ...result, updatedAt: new Date() }
          : c
        )
      );
      this.snackBar.open('Cámara actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(coldRoom: ColdRoom): void {
    this.dialog.open(ColdRoomDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: coldRoom,
    });
  }

  onDelete(coldRoom: ColdRoom): void {
    const ref = this.dialog.open(ColdRoomDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: coldRoom,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.coldRooms.update(list => list.filter(c => c.id !== coldRoom.id));
      this.snackBar.open('Cámara eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}
