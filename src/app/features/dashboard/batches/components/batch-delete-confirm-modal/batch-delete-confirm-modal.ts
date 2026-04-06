import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Batch } from '../../../../../core/models/batch.model';

@Component({
  selector: 'app-batch-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './batch-delete-confirm-modal.html',
  styleUrl: './batch-delete-confirm-modal.scss',
})
export class BatchDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<BatchDeleteConfirmModal>);
  readonly batch: Batch = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
