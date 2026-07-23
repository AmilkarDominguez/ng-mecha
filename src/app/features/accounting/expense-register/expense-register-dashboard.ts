import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { BankAccountHistory } from '../../../core/models/bank-account-history.model';
import { SPBankExpense } from '../../../core/services/supabase/sb-bank-expense';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ExpenseRegisterTable } from './components/expense-register-table/expense-register-table';
import {
  ExpenseRegisterFormModal,
  ExpenseRegisterFormData,
  ExpenseRegisterFormResult,
} from './components/expense-register-form-modal/expense-register-form-modal';
import { ExpenseRegisterDeleteConfirmModal } from './components/expense-register-delete-confirm-modal/expense-register-delete-confirm-modal';

@Component({
  selector: 'app-expense-register-dashboard',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ExpenseRegisterTable,
  ],
  templateUrl: './expense-register-dashboard.html',
  styleUrl: './expense-register-dashboard.scss',
})
export class ExpenseRegisterDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);
  private service = inject(SPBankExpense);

  readonly expenses = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredExpenses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.expenses();
    return this.expenses().filter(
      (h) =>
        (h.bank_account?.name ?? '').toLowerCase().includes(term) ||
        (h.transaction_type?.name ?? '').toLowerCase().includes(term) ||
        (h.concept ?? '').toLowerCase().includes(term),
    );
  });

  readonly totalAmount = computed(() => this.filteredExpenses().reduce((sum, h) => sum + (h.amount ?? 0), 0));

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(ExpenseRegisterFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {} satisfies ExpenseRegisterFormData,
    });

    ref.afterClosed().subscribe((result: ExpenseRegisterFormResult | null) => {
      if (!result) return;

      this.service
        .register({
          bankAccountId: result.bank_account_id,
          transactionTypeId: result.transaction_type_id,
          amount: result.amount,
          concept: result.concept,
          userId: this.auth.currentUser()?.id ?? null,
        })
        .subscribe({
          next: () => this.snackBar.open('Egreso registrado correctamente', 'Cerrar', { duration: 3000 }),
          error: (err) =>
            this.snackBar.open(err.message ?? 'Error al registrar el egreso', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  onEdit(history: BankAccountHistory): void {
    const ref = this.dialog.open(ExpenseRegisterFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { history } satisfies ExpenseRegisterFormData,
    });

    ref.afterClosed().subscribe((result: ExpenseRegisterFormResult | null) => {
      if (!result) return;

      this.service
        .edit(history.id, {
          bankAccountId: result.bank_account_id,
          transactionTypeId: result.transaction_type_id,
          amount: result.amount,
          concept: result.concept,
        })
        .subscribe({
          next: () => this.snackBar.open('Egreso actualizado correctamente', 'Cerrar', { duration: 3000 }),
          error: (err) =>
            this.snackBar.open(err.message ?? 'Error al actualizar el egreso', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  onDelete(history: BankAccountHistory): void {
    const ref = this.dialog.open(ExpenseRegisterDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: history,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.remove(history.id).subscribe({
        next: () => this.snackBar.open('Egreso eliminado', 'Cerrar', { duration: 3000 }),
        error: (err) => this.snackBar.open(err.message ?? 'Error al eliminar el egreso', 'Cerrar', { duration: 4000 }),
      });
    });
  }
}
