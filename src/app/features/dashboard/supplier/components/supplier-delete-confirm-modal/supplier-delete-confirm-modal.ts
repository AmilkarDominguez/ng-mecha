import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Supplier } from '../../../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './supplier-delete-confirm-modal.html',
  styleUrl: './supplier-delete-confirm-modal.scss',
})
export class SupplierDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<SupplierDeleteConfirmModal>);
  readonly supplier: Supplier = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
