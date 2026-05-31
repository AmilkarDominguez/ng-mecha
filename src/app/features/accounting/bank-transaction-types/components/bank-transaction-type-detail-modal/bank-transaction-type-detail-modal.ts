import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { BankTransactionType } from '../../../../../core/models/bank-transaction-type.model';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';

@Component({
  selector: 'app-bank-transaction-type-detail-modal',
  imports: [
    DatePipe,
    DialogFrame,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './bank-transaction-type-detail-modal.html',
  styleUrl: './bank-transaction-type-detail-modal.scss',
})
export class BankTransactionTypeDetailModal {
  private dialogRef = inject(MatDialogRef<BankTransactionTypeDetailModal>);
  readonly item: BankTransactionType = inject(MAT_DIALOG_DATA);

  typeLabel(type: string | null): string {
    if (type === 'INCOME') return 'Ingreso';
    if (type === 'EXPENSE') return 'Egreso';
    return '—';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
