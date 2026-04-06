import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Breed } from '../../../../../core/models/breed.model';

@Component({
  selector: 'app-breed-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './breed-delete-confirm-modal.html',
  styleUrl: './breed-delete-confirm-modal.scss',
})
export class BreedDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<BreedDeleteConfirmModal>);
  readonly breed: Breed = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
