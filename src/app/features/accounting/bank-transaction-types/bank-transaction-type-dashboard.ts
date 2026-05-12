import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { BankTransactionType } from '../../../core/models/bank-transaction-type.model';
import { SPBankTransactionType } from '../../../core/services/supabase/sb-bank-transaction-type';
import { BankTransactionTypeTable } from './components/bank-transaction-type-table/bank-transaction-type-table';
import {
  BankTransactionTypeFormModal,
  BankTransactionTypeFormData,
} from './components/bank-transaction-type-form-modal/bank-transaction-type-form-modal';
import { BankTransactionTypeDetailModal } from './components/bank-transaction-type-detail-modal/bank-transaction-type-detail-modal';
import { BankTransactionTypeDeleteConfirmModal } from './components/bank-transaction-type-delete-confirm-modal/bank-transaction-type-delete-confirm-modal';

@Component({
  selector: 'app-bank-transaction-type-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    BankTransactionTypeTable,
  ],
  templateUrl: './bank-transaction-type-dashboard.html',
  styleUrl: './bank-transaction-type-dashboard.scss',
})
export class BankTransactionTypeDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPBankTransactionType);

  readonly items = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.items();
    return this.items().filter(
      (i) =>
        (i.name ?? '').toLowerCase().includes(term) ||
        (i.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(BankTransactionTypeFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {} satisfies BankTransactionTypeFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newItem: BankTransactionType = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newItem).subscribe(() => {
        this.snackBar.open('Tipo de transacción registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(item: BankTransactionType): void {
    const ref = this.dialog.open(BankTransactionTypeFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { item } satisfies BankTransactionTypeFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: item.id }).subscribe(() => {
        this.snackBar.open('Tipo de transacción actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(item: BankTransactionType): void {
    this.dialog.open(BankTransactionTypeDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: item,
    });
  }

  onDelete(item: BankTransactionType): void {
    const ref = this.dialog.open(BankTransactionTypeDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: item,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(item.id).subscribe(() => {
        this.snackBar.open('Tipo de transacción eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
