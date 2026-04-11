import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';

@Component({
  selector: 'app-product-presentation-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './product-presentation-delete-confirm-modal.html',
  styleUrl: './product-presentation-delete-confirm-modal.scss',
})
export class ProductPresentationDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ProductPresentationDeleteConfirmModal>);
  readonly presentation: ProductPresentation = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
