import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../../../../core/models/customer.model';

@Component({
  selector: 'app-customer-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './customer-delete-confirm-modal.html',
  styleUrl: './customer-delete-confirm-modal.scss',
})
export class CustomerDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<CustomerDeleteConfirmModal>);
  readonly customer: Customer = inject(MAT_DIALOG_DATA);

  get fullName(): string {
    const parts = [this.customer.name, this.customer.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
