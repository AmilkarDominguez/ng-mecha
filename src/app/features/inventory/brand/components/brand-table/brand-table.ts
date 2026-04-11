import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Brand } from '../../../../../core/models/brand.model';

@Component({
  selector: 'app-brand-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './brand-table.html',
  styleUrl: './brand-table.scss',
})
export class BrandTable implements AfterViewInit {
  data = input<Brand[]>([]);

  edit = output<Brand>();
  view = output<Brand>();
  delete = output<Brand>();

  readonly displayedColumns = ['name', 'score', 'state', 'actions'];

  dataSource = new MatTableDataSource<Brand>([]);

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
        case 'score': return item.score ?? '';
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
