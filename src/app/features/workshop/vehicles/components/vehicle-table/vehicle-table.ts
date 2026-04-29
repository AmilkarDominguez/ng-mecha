import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vehicle } from '../../../../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './vehicle-table.html',
  styleUrl: './vehicle-table.scss',
})
export class VehicleTable implements AfterViewInit {
  data = input<Vehicle[]>([]);

  edit = output<Vehicle>();
  view = output<Vehicle>();
  delete = output<Vehicle>();

  readonly displayedColumns = ['license_plate', 'brand', 'model', 'year', 'state', 'actions'];

  dataSource = new MatTableDataSource<Vehicle>([]);

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
        case 'license_plate': return (item.license_plate ?? '').toLowerCase();
        case 'brand': return (item.brand ?? '').toLowerCase();
        case 'model': return (item.model ?? '').toLowerCase();
        case 'year': return (item.year ?? '').toLowerCase();
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
