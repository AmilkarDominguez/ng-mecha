import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { BankAccount } from '../../../core/models/bank-account.model';
import { SPBankAccount } from '../../../core/services/supabase/sb-bank-account';
import { BankAccountTable } from './components/bank-account-table/bank-account-table';
import {
  BankAccountFormModal,
  BankAccountFormData,
} from './components/bank-account-form-modal/bank-account-form-modal';
import { BankAccountDetailModal } from './components/bank-account-detail-modal/bank-account-detail-modal';
import { BankAccountDeleteConfirmModal } from './components/bank-account-delete-confirm-modal/bank-account-delete-confirm-modal';

@Component({
  selector: 'app-bank-account-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    BankAccountTable,
  ],
  templateUrl: './bank-account-dashboard.html',
  styleUrl: './bank-account-dashboard.scss',
})
export class BankAccountDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPBankAccount);

  readonly accounts = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredAccounts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.accounts();
    return this.accounts().filter(
      (a) =>
        (a.name ?? '').toLowerCase().includes(term) ||
        (a.number ?? '').toLowerCase().includes(term) ||
        (a.description ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(BankAccountFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {} satisfies BankAccountFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newAccount: BankAccount = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newAccount).subscribe(() => {
        this.snackBar.open('Cuenta bancaria registrada correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(account: BankAccount): void {
    const ref = this.dialog.open(BankAccountFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { account } satisfies BankAccountFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: account.id }).subscribe(() => {
        this.snackBar.open('Cuenta bancaria actualizada correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(account: BankAccount): void {
    this.dialog.open(BankAccountDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: account,
    });
  }

  onDelete(account: BankAccount): void {
    const ref = this.dialog.open(BankAccountDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: account,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(account.id).subscribe(() => {
        this.snackBar.open('Cuenta bancaria eliminada', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
