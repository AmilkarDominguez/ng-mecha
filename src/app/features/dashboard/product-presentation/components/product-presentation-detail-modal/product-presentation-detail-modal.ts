import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';

@Component({
  selector: 'app-product-presentation-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './product-presentation-detail-modal.html',
  styleUrl: './product-presentation-detail-modal.scss',
})
export class ProductPresentationDetailModal {
  private dialogRef = inject(MatDialogRef<ProductPresentationDetailModal>);
  readonly presentation: ProductPresentation = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
