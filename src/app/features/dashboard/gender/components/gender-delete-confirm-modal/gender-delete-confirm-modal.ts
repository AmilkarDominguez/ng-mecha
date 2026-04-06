import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Gender } from '../../../../../core/models/gender.model';

@Component({
  selector: 'app-gender-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './gender-delete-confirm-modal.html',
  styleUrl: './gender-delete-confirm-modal.scss',
})
export class GenderDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<GenderDeleteConfirmModal>);
  readonly gender: Gender = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
