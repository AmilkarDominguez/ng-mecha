import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OwnershipTransfer } from '../../../core/models/ownership-transfer.model';
import { OWNERSHIP_TRANSFER_MOCK } from './ownership-transfer.mock';
import { OwnershipTransferTable } from './components/ownership-transfer-table/ownership-transfer-table';
import { OwnershipTransferFormModal, OwnershipTransferFormData } from './components/ownership-transfer-form-modal/ownership-transfer-form-modal';
import { OwnershipTransferDetailModal } from './components/ownership-transfer-detail-modal/ownership-transfer-detail-modal';
import { OwnershipTransferDeleteConfirmModal } from './components/ownership-transfer-delete-confirm-modal/ownership-transfer-delete-confirm-modal';

@Component({
  selector: 'app-ownership-transfer-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    OwnershipTransferTable,
  ],
  templateUrl: './ownership-transfer-dashboard.html',
  styleUrl: './ownership-transfer-dashboard.scss',
})
export class OwnershipTransferDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private transfers = signal<OwnershipTransfer[]>(OWNERSHIP_TRANSFER_MOCK);
  searchTerm = signal('');

  filteredTransfers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.transfers();
    return this.transfers().filter(t =>
      t.animalTag.toLowerCase().includes(term) ||
      t.fromRancherName.toLowerCase().includes(term) ||
      t.toRancherName.toLowerCase().includes(term) ||
      t.fromBrandName.toLowerCase().includes(term) ||
      t.toBrandName.toLowerCase().includes(term) ||
      t.reason.toLowerCase().includes(term) ||
      t.registeredByName.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(OwnershipTransferFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: {} satisfies OwnershipTransferFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newTransfer: OwnershipTransfer = {
        id: crypto.randomUUID(),
        animalId: crypto.randomUUID(),
        animalTag: result.animalTag,
        fromRancherId: crypto.randomUUID(),
        fromRancherName: result.fromRancherName,
        fromBrandId: crypto.randomUUID(),
        fromBrandName: result.fromBrandName,
        toRancherId: crypto.randomUUID(),
        toRancherName: result.toRancherName,
        toBrandId: crypto.randomUUID(),
        toBrandName: result.toBrandName,
        reason: result.reason,
        supportDocUrl: result.supportDocUrl ?? '',
        registeredById: 'usr-001',
        registeredByName: 'Administrador',
        transferredAt: new Date(result.transferredAt),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.transfers.update(list => [newTransfer, ...list]);
      this.snackBar.open('Transferencia registrada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(transfer: OwnershipTransfer): void {
    const ref = this.dialog.open(OwnershipTransferFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: { transfer } satisfies OwnershipTransferFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.transfers.update(list =>
        list.map(t => t.id === transfer.id
          ? {
              ...t,
              animalTag: result.animalTag,
              fromRancherName: result.fromRancherName,
              fromBrandName: result.fromBrandName,
              toRancherName: result.toRancherName,
              toBrandName: result.toBrandName,
              reason: result.reason,
              supportDocUrl: result.supportDocUrl ?? '',
              transferredAt: new Date(result.transferredAt),
              updatedAt: new Date(),
            }
          : t
        )
      );
      this.snackBar.open('Transferencia actualizada correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(transfer: OwnershipTransfer): void {
    this.dialog.open(OwnershipTransferDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: transfer,
    });
  }

  onDelete(transfer: OwnershipTransfer): void {
    const ref = this.dialog.open(OwnershipTransferDeleteConfirmModal, {
      width: '30rem',
      maxWidth: '95vw',
      data: transfer,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.transfers.update(list => list.filter(t => t.id !== transfer.id));
      this.snackBar.open('Transferencia eliminada', 'Cerrar', { duration: 3000 });
    });
  }
}
