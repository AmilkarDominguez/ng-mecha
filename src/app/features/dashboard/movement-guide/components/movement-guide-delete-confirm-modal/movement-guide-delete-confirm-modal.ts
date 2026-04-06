import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MovementGuide } from '../../../../../core/models/movement-guide.model';

@Component({
  selector: 'app-movement-guide-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './movement-guide-delete-confirm-modal.html',
  styleUrl: './movement-guide-delete-confirm-modal.scss',
})
export class MovementGuideDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<MovementGuideDeleteConfirmModal>);
  readonly guide: MovementGuide = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
