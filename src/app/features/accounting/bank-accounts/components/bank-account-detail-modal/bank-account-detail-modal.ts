import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { BankAccount } from '../../../../../core/models/bank-account.model';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';

@Component({
  selector: 'app-bank-account-detail-modal',
  imports: [
    CurrencyPipe,
    DatePipe,
    DialogFrame,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './bank-account-detail-modal.html',
  styleUrl: './bank-account-detail-modal.scss',
})
export class BankAccountDetailModal {
  private dialogRef = inject(MatDialogRef<BankAccountDetailModal>);
  readonly account: BankAccount = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
