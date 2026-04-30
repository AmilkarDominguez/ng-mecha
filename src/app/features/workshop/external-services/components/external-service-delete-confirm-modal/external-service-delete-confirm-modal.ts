import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ExternalService } from '../../../../../core/models/external-service.model';

@Component({
  selector: 'app-external-service-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './external-service-delete-confirm-modal.html',
  styleUrl: './external-service-delete-confirm-modal.scss',
})
export class ExternalServiceDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ExternalServiceDeleteConfirmModal>);
  readonly externalService: ExternalService = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
