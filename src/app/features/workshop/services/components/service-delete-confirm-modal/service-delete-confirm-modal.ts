import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Service } from '../../../../../core/models/service.model';

@Component({
  selector: 'app-service-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './service-delete-confirm-modal.html',
  styleUrl: './service-delete-confirm-modal.scss',
})
export class ServiceDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ServiceDeleteConfirmModal>);
  readonly service: Service = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
