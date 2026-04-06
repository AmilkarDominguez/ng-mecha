import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { OwnershipTransfer } from '../../../../../core/models/ownership-transfer.model';

@Component({
  selector: 'app-ownership-transfer-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './ownership-transfer-detail-modal.html',
  styleUrl: './ownership-transfer-detail-modal.scss',
})
export class OwnershipTransferDetailModal {
  private dialogRef = inject(MatDialogRef<OwnershipTransferDetailModal>);
  readonly transfer: OwnershipTransfer = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
