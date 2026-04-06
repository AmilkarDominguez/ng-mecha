import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Warehouse } from '../../../../../core/models/warehouse.model';

@Component({
  selector: 'app-warehouse-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './warehouse-table.html',
  styleUrl: './warehouse-table.scss',
})
export class WarehouseTable implements AfterViewInit {
  data = input<Warehouse[]>([]);

  edit = output<Warehouse>();
  view = output<Warehouse>();
  delete = output<Warehouse>();

  readonly displayedColumns = ['name', 'state', 'actions'];

  dataSource = new MatTableDataSource<Warehouse>([]);

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
        case 'name': return item.name.toLowerCase();
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
