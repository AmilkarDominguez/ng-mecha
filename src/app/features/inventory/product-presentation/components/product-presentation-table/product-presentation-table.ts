import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';

@Component({
  selector: 'app-product-presentation-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './product-presentation-table.html',
  styleUrl: './product-presentation-table.scss',
})
export class ProductPresentationTable implements AfterViewInit {
  data = input<ProductPresentation[]>([]);

  edit = output<ProductPresentation>();
  view = output<ProductPresentation>();
  delete = output<ProductPresentation>();

  readonly displayedColumns = ['name', 'code', 'state', 'actions'];

  dataSource = new MatTableDataSource<ProductPresentation>([]);

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
        case 'code': return (item.code ?? '').toLowerCase();
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
