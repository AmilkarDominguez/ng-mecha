import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import type { ChartConfiguration } from 'chart.js';
import { Batch } from '../../../core/models/batch.model';
import { SPBatch } from '../../../core/services/supabase/sb-batch';
import { SPWarehouse } from '../../../core/services/supabase/sb-warehouse';
import { SPBrand } from '../../../core/services/supabase/sb-brand';
import { SPProductCategory } from '../../../core/services/supabase/sb-product-cateogory';
import { ReportChart } from '../../../shared/components/report-chart/report-chart';
import { getChartPalette } from '../../../shared/utils/chart-colors';

const TOP_N = 10;

// Umbral de "stock bajo" cuando el lote no definio min_stock — mismo
// fallback usado en batch-table.html/batch-detail-modal.html.
const DEFAULT_MIN_STOCK = 10;

interface StockReportRow {
  id: string;
  code: string | null;
  productName: string;
  categoryName: string;
  brandName: string;
  warehouseName: string;
  stock: number;
  availableStock: number;
  minStock: number;
  isLow: boolean;
}

interface StockFilters {
  warehouseId: string | null;
  categoryId: string | null;
  brandId: string | null;
  lowStockOnly: boolean;
}

const EMPTY_FILTERS: StockFilters = {
  warehouseId: null,
  categoryId: null,
  brandId: null,
  lowStockOnly: false,
};

@Component({
  selector: 'app-stock-report-dashboard',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    DecimalPipe,
    ReportChart,
  ],
  templateUrl: './stock-report-dashboard.html',
  styleUrl: './stock-report-dashboard.scss',
})
export class StockReportDashboard {
  private batchService = inject(SPBatch);

  private readonly batches = toSignal(this.batchService.listen(), { initialValue: [] as Batch[] });
  private readonly availableStock = toSignal(this.batchService.getAvailableStock(), {
    initialValue: {} as Record<string, number>,
  });

  private readonly warehouses = toSignal(inject(SPWarehouse).listen(), { initialValue: [] });
  private readonly brands = toSignal(inject(SPBrand).listen(), { initialValue: [] });
  private readonly categories = toSignal(inject(SPProductCategory).listen(), { initialValue: [] });

  readonly activeWarehouses = computed(() => this.warehouses().filter((w) => w.state === 'ACTIVE'));
  readonly activeBrands = computed(() => this.brands().filter((b) => b.state === 'ACTIVE'));
  readonly activeCategories = computed(() => this.categories().filter((c) => c.state === 'ACTIVE'));

  readonly columns = ['product', 'category', 'brand', 'warehouse', 'stock', 'min_stock', 'status'];

  readonly filterForm = new FormGroup({
    warehouse_id: new FormControl<string | null>(null),
    category_id: new FormControl<string | null>(null),
    brand_id: new FormControl<string | null>(null),
    low_stock_only: new FormControl<boolean>(false, { nonNullable: true }),
  });

  readonly appliedFilters = signal<StockFilters>(EMPTY_FILTERS);

  readonly rows = computed<StockReportRow[]>(() => {
    const filters = this.appliedFilters();
    const availableMap = this.availableStock();

    return this.batches()
      .filter((b) => b.state === 'ACTIVE')
      .filter((b) => !filters.warehouseId || b.warehouse_id === filters.warehouseId)
      .filter((b) => !filters.categoryId || b.product?.category?.id === filters.categoryId)
      .filter((b) => !filters.brandId || b.brand_id === filters.brandId)
      .map((b): StockReportRow => {
        const minStock = b.min_stock ?? DEFAULT_MIN_STOCK;
        const available = availableMap[b.id] ?? b.stock ?? 0;
        return {
          id: b.id,
          code: b.code,
          productName: b.product?.name ?? '—',
          categoryName: b.product?.category?.name ?? '—',
          brandName: b.brand?.name ?? '—',
          warehouseName: b.warehouse?.name ?? '—',
          stock: b.stock ?? 0,
          availableStock: available,
          minStock,
          isLow: available < minStock,
        };
      })
      .filter((r) => !filters.lowStockOnly || r.isLow)
      .sort((a, b) => a.availableStock - b.availableStock);
  });

  readonly lowStockCount = computed(() => this.rows().filter((r) => r.isLow).length);

  readonly statusChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const palette = getChartPalette();
    const low = this.lowStockCount();
    const ok = this.rows().length - low;
    return {
      labels: ['Stock bajo', 'OK'],
      datasets: [{ data: [low, ok], backgroundColor: [palette.red, palette.green] }],
    };
  });

  readonly lowestStockChartTopCount = computed(() => Math.min(TOP_N, this.rows().length));

  readonly lowestStockChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const palette = getChartPalette();
    const top = this.rows().slice(0, TOP_N);
    return {
      labels: top.map((r) => r.productName),
      datasets: [{ label: 'Disponible', data: top.map((r) => r.availableStock), backgroundColor: palette.red }],
    };
  });

  readonly lowestStockChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
  };

  search(): void {
    const raw = this.filterForm.getRawValue();
    this.appliedFilters.set({
      warehouseId: raw.warehouse_id,
      categoryId: raw.category_id,
      brandId: raw.brand_id,
      lowStockOnly: raw.low_stock_only,
    });
  }

  onClearFilters(): void {
    this.filterForm.reset({
      warehouse_id: null,
      category_id: null,
      brand_id: null,
      low_stock_only: false,
    });
    this.appliedFilters.set(EMPTY_FILTERS);
  }
}
