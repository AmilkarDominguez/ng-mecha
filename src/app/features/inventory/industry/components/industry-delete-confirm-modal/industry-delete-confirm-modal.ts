import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Industry } from '../../../../../core/models/industry.model';

@Component({
  selector: 'app-industry-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './industry-delete-confirm-modal.html',
  styleUrl: './industry-delete-confirm-modal.scss',
})
export class IndustryDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<IndustryDeleteConfirmModal>);
  readonly industry: Industry = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
