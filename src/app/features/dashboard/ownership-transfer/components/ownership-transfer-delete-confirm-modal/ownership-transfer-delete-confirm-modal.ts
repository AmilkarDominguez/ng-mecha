import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { OwnershipTransfer } from '../../../../../core/models/ownership-transfer.model';

@Component({
  selector: 'app-ownership-transfer-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './ownership-transfer-delete-confirm-modal.html',
  styleUrl: './ownership-transfer-delete-confirm-modal.scss',
})
export class OwnershipTransferDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<OwnershipTransferDeleteConfirmModal>);
  readonly transfer: OwnershipTransfer = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
