import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Customer } from '../../../../../core/models/customer.model';

@Component({
  selector: 'app-customer-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './customer-detail-modal.html',
  styleUrl: './customer-detail-modal.scss',
})
export class CustomerDetailModal {
  private dialogRef = inject(MatDialogRef<CustomerDetailModal>);
  readonly customer: Customer = inject(MAT_DIALOG_DATA);

  get fullName(): string {
    const parts = [this.customer.name, this.customer.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
