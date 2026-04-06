import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SlaughterRecord } from '../../../../../core/models/slaughter-record.model';

@Component({
  selector: 'app-slaughter-record-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './slaughter-record-delete-confirm-modal.html',
  styleUrl: './slaughter-record-delete-confirm-modal.scss',
})
export class SlaughterRecordDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<SlaughterRecordDeleteConfirmModal>);
  readonly record: SlaughterRecord = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
