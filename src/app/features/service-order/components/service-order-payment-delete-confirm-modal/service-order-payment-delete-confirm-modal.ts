import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BankAccountHistory } from '../../../../core/models/bank-account-history.model';

@Component({
  selector: 'app-service-order-payment-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DecimalPipe],
  templateUrl: './service-order-payment-delete-confirm-modal.html',
  styleUrl: './service-order-payment-delete-confirm-modal.scss',
})
export class ServiceOrderPaymentDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ServiceOrderPaymentDeleteConfirmModal>);
  readonly payment: BankAccountHistory = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
