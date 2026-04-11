import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProductCategory } from '../../../../../core/models/product-category.model';

@Component({
  selector: 'app-product-category-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './product-category-delete-confirm-modal.html',
  styleUrl: './product-category-delete-confirm-modal.scss',
})
export class ProductCategoryDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ProductCategoryDeleteConfirmModal>);
  readonly category: ProductCategory = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
