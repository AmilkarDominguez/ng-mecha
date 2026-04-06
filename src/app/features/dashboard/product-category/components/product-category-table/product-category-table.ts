import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProductCategory } from '../../../../../core/models/product-category.model';

@Component({
  selector: 'app-product-category-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './product-category-table.html',
  styleUrl: './product-category-table.scss',
})
export class ProductCategoryTable implements AfterViewInit {
  data = input<ProductCategory[]>([]);

  edit = output<ProductCategory>();
  view = output<ProductCategory>();
  delete = output<ProductCategory>();

  readonly displayedColumns = ['name', 'icon', 'view', 'state', 'actions'];

  dataSource = new MatTableDataSource<ProductCategory>([]);

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
        case 'icon': return (item.icon ?? '').toLowerCase();
        case 'view': return (item.view ?? '').toLowerCase();
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
