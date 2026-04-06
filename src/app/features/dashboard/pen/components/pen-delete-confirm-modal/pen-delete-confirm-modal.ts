import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Pen } from '../../../../../core/models/pen.model';

@Component({
  selector: 'app-pen-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './pen-delete-confirm-modal.html',
  styleUrl: './pen-delete-confirm-modal.scss',
})
export class PenDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<PenDeleteConfirmModal>);
  readonly pen: Pen = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
