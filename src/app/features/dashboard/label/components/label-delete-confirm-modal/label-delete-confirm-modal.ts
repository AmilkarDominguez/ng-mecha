import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Label } from '../../../../../core/models/label.model';

@Component({
  selector: 'app-label-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './label-delete-confirm-modal.html',
  styleUrl: './label-delete-confirm-modal.scss',
})
export class LabelDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<LabelDeleteConfirmModal>);
  readonly label: Label = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
