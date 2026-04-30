import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Service } from '../../../../../core/models/service.model';

@Component({
  selector: 'app-service-table',
  imports: [
    CurrencyPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './service-table.html',
  styleUrl: './service-table.scss',
})
export class ServiceTable implements AfterViewInit {
  data = input<Service[]>([]);

  edit = output<Service>();
  view = output<Service>();
  delete = output<Service>();

  readonly displayedColumns = ['name', 'code', 'price', 'state', 'actions'];

  dataSource = new MatTableDataSource<Service>([]);

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
        case 'price': return item.price ?? 0;
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
