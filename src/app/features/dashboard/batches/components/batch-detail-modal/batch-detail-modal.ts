import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Batch } from '../../../../../core/models/batch.model';
import { Product } from '../../../../../core/models/product.model';
import { Warehouse } from '../../../../../core/models/warehouse.model';
import { Supplier } from '../../../../../core/models/supplier.model';
import { Industry } from '../../../../../core/models/industry.model';
import { Brand } from '../../../../../core/models/brand.model';

export interface BatchDetailData {
  batch: Batch;
  products: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  industries: Industry[];
  brands: Brand[];
}

@Component({
  selector: 'app-batch-detail-modal',
  imports: [
    DatePipe,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './batch-detail-modal.html',
  styleUrl: './batch-detail-modal.scss',
})
export class BatchDetailModal {
  private dialogRef = inject(MatDialogRef<BatchDetailModal>);
  readonly data: BatchDetailData = inject(MAT_DIALOG_DATA);

  get batch(): Batch {
    return this.data.batch;
  }

  getProductName(id: string): string {
    return this.data.products.find(p => p.id === id)?.name ?? '—';
  }

  getWarehouseName(id: string): string {
    return this.data.warehouses.find(w => w.id === id)?.name ?? '—';
  }

  getSupplierName(id: string): string {
    return this.data.suppliers.find(s => s.id === id)?.name ?? '—';
  }

  getIndustryName(id: string): string {
    return this.data.industries.find(i => i.id === id)?.name ?? '—';
  }

  getBrandName(id: string | null): string {
    if (!id) return '—';
    return this.data.brands.find(b => b.id === id)?.name ?? '—';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
