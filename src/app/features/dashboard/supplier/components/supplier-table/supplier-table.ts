import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Supplier } from '../../../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './supplier-table.html',
  styleUrl: './supplier-table.scss',
})
export class SupplierTable implements AfterViewInit {
  data = input<Supplier[]>([]);

  edit = output<Supplier>();
  view = output<Supplier>();
  delete = output<Supplier>();

  readonly displayedColumns = ['name', 'email', 'address', 'state', 'actions'];

  dataSource = new MatTableDataSource<Supplier>([]);

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
        case 'email': return (item.email ?? '').toLowerCase();
        case 'address': return (item.address ?? '').toLowerCase();
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
