import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../../../../core/models/product.model';
import { ProductCategory } from '../../../../../core/models/product-category.model';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';

@Component({
  selector: 'app-product-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './product-table.html',
  styleUrl: './product-table.scss',
})
export class ProductTable implements AfterViewInit {
  data = input<Product[]>([]);
  categories = input<ProductCategory[]>([]);
  presentations = input<ProductPresentation[]>([]);

  edit = output<Product>();
  view = output<Product>();
  delete = output<Product>();

  readonly displayedColumns = ['name', 'category', 'presentation', 'state', 'actions'];

  dataSource = new MatTableDataSource<Product>([]);

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
        case 'name': return (item.name ?? '').toLowerCase();
        case 'category': return this.getCategoryName(item.category_id).toLowerCase();
        case 'presentation': return this.getPresentationName(item.presentation_id).toLowerCase();
        case 'state': return item.state;
        default: return '';
      }
    };
  }

  getCategoryName(id: string | null): string {
    if (!id) return '—';
    return this.categories().find(c => c.id === id)?.name ?? '—';
  }

  getPresentationName(id: string | null): string {
    if (!id) return '—';
    const p = this.presentations().find(p => p.id === id);
    return p ? (p.code ? `${p.name} (${p.code})` : (p.name ?? '—')) : '—';
  }
}
