import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Product } from '../../../../../core/models/product.model';
import { ProductCategory } from '../../../../../core/models/product-category.model';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';

export interface ProductDetailData {
  product: Product;
  categories: ProductCategory[];
  presentations: ProductPresentation[];
}

@Component({
  selector: 'app-product-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.scss',
})
export class ProductDetailModal {
  private dialogRef = inject(MatDialogRef<ProductDetailModal>);
  private data: ProductDetailData = inject(MAT_DIALOG_DATA);

  readonly product: Product = this.data.product;

  getCategoryName(): string {
    if (!this.product.categoryId) return '—';
    return this.data.categories.find(c => c.id === this.product.categoryId)?.name ?? '—';
  }

  getPresentationName(): string {
    if (!this.product.presentationId) return '—';
    const p = this.data.presentations.find(p => p.id === this.product.presentationId);
    if (!p) return '—';
    return p.code ? `${p.name} (${p.code})` : (p.name ?? '—');
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
