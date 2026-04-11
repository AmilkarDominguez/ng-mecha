import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Brand } from '../../../../../core/models/brand.model';

@Component({
  selector: 'app-brand-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './brand-delete-confirm-modal.html',
  styleUrl: './brand-delete-confirm-modal.scss',
})
export class BrandDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<BrandDeleteConfirmModal>);
  readonly brand: Brand = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
