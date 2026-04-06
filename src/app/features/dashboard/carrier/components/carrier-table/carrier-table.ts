import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Carrier } from '../../../../../core/models/carrier.model';

@Component({
  selector: 'app-carrier-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './carrier-table.html',
  styleUrl: './carrier-table.scss',
})
export class CarrierTable implements AfterViewInit {
  data = input<Carrier[]>([]);

  edit = output<Carrier>();
  view = output<Carrier>();
  delete = output<Carrier>();

  readonly displayedColumns = ['businessName', 'vehiclePlate', 'phone', 'isActive', 'actions'];

  dataSource = new MatTableDataSource<Carrier>([]);

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
        case 'businessName': return item.businessName.toLowerCase();
        case 'vehiclePlate': return item.vehiclePlate.toLowerCase();
        case 'phone': return item.phone;
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }
}
