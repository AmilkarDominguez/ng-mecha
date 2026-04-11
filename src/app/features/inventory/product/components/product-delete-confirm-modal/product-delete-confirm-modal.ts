import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../../../core/models/product.model';

@Component({
  selector: 'app-product-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './product-delete-confirm-modal.html',
  styleUrl: './product-delete-confirm-modal.scss',
})
export class ProductDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ProductDeleteConfirmModal>);
  readonly product: Product = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
