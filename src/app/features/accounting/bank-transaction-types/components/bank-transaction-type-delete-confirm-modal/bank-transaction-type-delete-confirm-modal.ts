import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BankTransactionType } from '../../../../../core/models/bank-transaction-type.model';

@Component({
  selector: 'app-bank-transaction-type-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './bank-transaction-type-delete-confirm-modal.html',
  styleUrl: './bank-transaction-type-delete-confirm-modal.scss',
})
export class BankTransactionTypeDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<BankTransactionTypeDeleteConfirmModal>);
  readonly item: BankTransactionType = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
