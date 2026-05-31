import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ProductCategory } from '../../../../../core/models/product-category.model';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';

@Component({
  selector: 'app-product-category-detail-modal',
  imports: [
    DatePipe,
    DialogFrame,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './product-category-detail-modal.html',
  styleUrl: './product-category-detail-modal.scss',
})
export class ProductCategoryDetailModal {
  private dialogRef = inject(MatDialogRef<ProductCategoryDetailModal>);
  readonly category: ProductCategory = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
