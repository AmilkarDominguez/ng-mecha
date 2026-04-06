import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Animal } from '../../../../../core/models/animal.model';

@Component({
  selector: 'app-animal-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './animal-delete-confirm-modal.html',
  styleUrl: './animal-delete-confirm-modal.scss',
})
export class AnimalDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<AnimalDeleteConfirmModal>);
  readonly animal: Animal = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
