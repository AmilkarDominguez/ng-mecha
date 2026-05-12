import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BankAccount } from '../../../../../core/models/bank-account.model';

@Component({
  selector: 'app-bank-account-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './bank-account-delete-confirm-modal.html',
  styleUrl: './bank-account-delete-confirm-modal.scss',
})
export class BankAccountDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<BankAccountDeleteConfirmModal>);
  readonly account: BankAccount = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
