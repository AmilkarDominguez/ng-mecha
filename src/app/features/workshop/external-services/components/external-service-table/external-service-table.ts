import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExternalService } from '../../../../../core/models/external-service.model';

@Component({
  selector: 'app-external-service-table',
  imports: [
    CurrencyPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './external-service-table.html',
  styleUrl: './external-service-table.scss',
})
export class ExternalServiceTable implements AfterViewInit {
  data = input<ExternalService[]>([]);

  edit = output<ExternalService>();
  view = output<ExternalService>();
  delete = output<ExternalService>();

  readonly displayedColumns = ['name', 'cost', 'price', 'state', 'actions'];

  dataSource = new MatTableDataSource<ExternalService>([]);

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
        case 'cost': return item.cost ?? 0;
        case 'price': return item.price ?? 0;
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
