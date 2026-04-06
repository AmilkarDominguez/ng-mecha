import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Rancher } from '../../../../../core/models/rancher.model';

@Component({
  selector: 'app-rancher-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './rancher-delete-confirm-modal.html',
  styleUrl: './rancher-delete-confirm-modal.scss',
})
export class RancherDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<RancherDeleteConfirmModal>);
  readonly rancher: Rancher = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
