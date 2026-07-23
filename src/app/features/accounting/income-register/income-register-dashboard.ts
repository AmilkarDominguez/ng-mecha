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
import { SPBankIncome } from '../../../core/services/supabase/sb-bank-income';
import { AuthService } from '../../../core/auth/services/auth.service';
import { IncomeRegisterTable } from './components/income-register-table/income-register-table';
import {
  IncomeRegisterFormModal,
  IncomeRegisterFormData,
  IncomeRegisterFormResult,
} from './components/income-register-form-modal/income-register-form-modal';
import { IncomeRegisterDeleteConfirmModal } from './components/income-register-delete-confirm-modal/income-register-delete-confirm-modal';

@Component({
  selector: 'app-income-register-dashboard',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    IncomeRegisterTable,
  ],
  templateUrl: './income-register-dashboard.html',
  styleUrl: './income-register-dashboard.scss',
})
export class IncomeRegisterDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);
  private service = inject(SPBankIncome);

  readonly incomes = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredIncomes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.incomes();
    return this.incomes().filter(
      (h) =>
        (h.bank_account?.name ?? '').toLowerCase().includes(term) ||
        (h.transaction_type?.name ?? '').toLowerCase().includes(term) ||
        (h.concept ?? '').toLowerCase().includes(term),
    );
  });

  readonly totalAmount = computed(() => this.filteredIncomes().reduce((sum, h) => sum + (h.amount ?? 0), 0));

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(IncomeRegisterFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {} satisfies IncomeRegisterFormData,
    });

    ref.afterClosed().subscribe((result: IncomeRegisterFormResult | null) => {
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
          next: () => this.snackBar.open('Ingreso registrado correctamente', 'Cerrar', { duration: 3000 }),
          error: (err) =>
            this.snackBar.open(err.message ?? 'Error al registrar el ingreso', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  onEdit(history: BankAccountHistory): void {
    const ref = this.dialog.open(IncomeRegisterFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { history } satisfies IncomeRegisterFormData,
    });

    ref.afterClosed().subscribe((result: IncomeRegisterFormResult | null) => {
      if (!result) return;

      this.service
        .edit(history.id, {
          bankAccountId: result.bank_account_id,
          transactionTypeId: result.transaction_type_id,
          amount: result.amount,
          concept: result.concept,
        })
        .subscribe({
          next: () => this.snackBar.open('Ingreso actualizado correctamente', 'Cerrar', { duration: 3000 }),
          error: (err) =>
            this.snackBar.open(err.message ?? 'Error al actualizar el ingreso', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  onDelete(history: BankAccountHistory): void {
    const ref = this.dialog.open(IncomeRegisterDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: history,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.remove(history.id).subscribe({
        next: () => this.snackBar.open('Ingreso eliminado', 'Cerrar', { duration: 3000 }),
        error: (err) => this.snackBar.open(err.message ?? 'Error al eliminar el ingreso', 'Cerrar', { duration: 4000 }),
      });
    });
  }
}
