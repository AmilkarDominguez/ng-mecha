import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Batch } from '../../../../core/models/batch.model';
import { SPBatch } from '../../../../core/services/supabase/sb-batch';
import { SPProduct } from '../../../../core/services/supabase/sb-product';
import { SPWarehouse } from '../../../../core/services/supabase/sb-warehouse';
import { SPSupplier } from '../../../../core/services/supabase/sb-supplier';
import { SPIndustry } from '../../../../core/services/supabase/sb-industry';
import { SPBrand } from '../../../../core/services/supabase/sb-brand';
import { BatchDetailModal, BatchDetailData } from '../../../inventory/batches/components/batch-detail-modal/batch-detail-modal';

// Mismo fallback usado en batch-table.html / batch-detail-modal.html /
// el Reporte de Lotes - Stock (A.4, reports.md) — un lote sin min_stock
// configurado se considera "bajo" por debajo de 10 unidades disponibles.
const DEFAULT_MIN_STOCK = 10;

interface LowStockRow {
  batch: Batch;
  productName: string;
  availableStock: number;
  minStock: number;
}

@Component({
  selector: 'app-low-stock-card',
  imports: [
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './low-stock-card.html',
  styleUrl: './low-stock-card.scss',
})
export class LowStockCard {
  private dialog = inject(MatDialog);
  private batchService = inject(SPBatch);
  private productService = inject(SPProduct);
  private warehouseService = inject(SPWarehouse);
  private supplierService = inject(SPSupplier);
  private industryService = inject(SPIndustry);
  private brandService = inject(SPBrand);

  private readonly batches = toSignal(this.batchService.listen(), { initialValue: [] as Batch[] });
  private readonly availableStock = toSignal(this.batchService.getAvailableStock(), {
    initialValue: {} as Record<string, number>,
  });

  private readonly products = toSignal(this.productService.listen(), { initialValue: [] });
  private readonly warehouses = toSignal(this.warehouseService.listen(), { initialValue: [] });
  private readonly suppliers = toSignal(this.supplierService.listen(), { initialValue: [] });
  private readonly industries = toSignal(this.industryService.listen(), { initialValue: [] });
  private readonly brands = toSignal(this.brandService.listen(), { initialValue: [] });

  readonly lowStockBatches = computed<LowStockRow[]>(() => {
    const availableMap = this.availableStock();
    return this.batches()
      .filter((b) => b.state === 'ACTIVE')
      .map((b): LowStockRow => {
        const minStock = b.min_stock ?? DEFAULT_MIN_STOCK;
        const available = availableMap[b.id] ?? b.stock ?? 0;
        return {
          batch: b,
          productName: b.product?.name ?? b.description ?? b.code ?? 'Lote sin nombre',
          availableStock: available,
          minStock,
        };
      })
      .filter((r) => r.availableStock < r.minStock)
      .sort((a, b) => a.availableStock - b.availableStock);
  });

  openDetail(row: LowStockRow): void {
    this.dialog.open(BatchDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {
        batch: row.batch,
        products: this.products(),
        warehouses: this.warehouses(),
        suppliers: this.suppliers(),
        industries: this.industries(),
        brands: this.brands(),
      } satisfies BatchDetailData,
    });
  }
}
