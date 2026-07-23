import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BankAccountHistory } from '../../../../../core/models/bank-account-history.model';

@Component({
  selector: 'app-expense-register-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CurrencyPipe],
  templateUrl: './expense-register-delete-confirm-modal.html',
  styleUrl: './expense-register-delete-confirm-modal.scss',
})
export class ExpenseRegisterDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ExpenseRegisterDeleteConfirmModal>);
  readonly history: BankAccountHistory = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
