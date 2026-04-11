import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Batch } from '../../../../../core/models/batch.model';
import { Product } from '../../../../../core/models/product.model';
import { Warehouse } from '../../../../../core/models/warehouse.model';

@Component({
  selector: 'app-batch-table',
  imports: [
    DecimalPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './batch-table.html',
  styleUrl: './batch-table.scss',
})
export class BatchTable implements AfterViewInit {
  data = input<Batch[]>([]);
  products = input<Product[]>([]);
  warehouses = input<Warehouse[]>([]);

  edit = output<Batch>();
  view = output<Batch>();
  delete = output<Batch>();

  readonly displayedColumns = ['code', 'product', 'warehouse', 'stock', 'finalPrice', 'state', 'actions'];

  dataSource = new MatTableDataSource<Batch>([]);

  sort = viewChild.required(MatSort);
  paginator = viewChild.required(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.data();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'code': return item.code ?? '';
        case 'product': return this.getProductName(item.productId).toLowerCase();
        case 'warehouse': return this.getWarehouseName(item.warehouseId).toLowerCase();
        case 'stock': return item.stock ?? 0;
        case 'finalPrice': return item.finalPrice ?? 0;
        case 'state': return item.state;
        default: return '';
      }
    };
  }

  getProductName(productId: string): string {
    return this.products().find(p => p.id === productId)?.name ?? '—';
  }

  getWarehouseName(warehouseId: string): string {
    return this.warehouses().find(w => w.id === warehouseId)?.name ?? '—';
  }
}
