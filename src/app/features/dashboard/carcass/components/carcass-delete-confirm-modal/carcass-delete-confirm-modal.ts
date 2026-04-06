import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Carcass } from '../../../../../core/models/carcass.model';

@Component({
  selector: 'app-carcass-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './carcass-delete-confirm-modal.html',
  styleUrl: './carcass-delete-confirm-modal.scss',
})
export class CarcassDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<CarcassDeleteConfirmModal>);
  readonly carcass: Carcass = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
