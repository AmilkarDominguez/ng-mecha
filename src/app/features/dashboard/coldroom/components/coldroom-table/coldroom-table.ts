import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ColdRoom } from '../../../../../core/models/coldroom.model';

@Component({
  selector: 'app-coldroom-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './coldroom-table.html',
  styleUrl: './coldroom-table.scss',
})
export class ColdRoomTable implements AfterViewInit {
  data = input<ColdRoom[]>([]);

  edit = output<ColdRoom>();
  view = output<ColdRoom>();
  delete = output<ColdRoom>();

  readonly displayedColumns = ['name', 'code', 'capacity', 'temperature', 'isActive', 'actions'];

  dataSource = new MatTableDataSource<ColdRoom>([]);

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
        case 'code': return item.code.toLowerCase();
        case 'capacity': return item.capacity;
        case 'temperature': return item.minTemperature;
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }

  occupancyPercent(room: ColdRoom): number {
    if (room.capacity === 0) return 0;
    return Math.round((room.currentOccupancy / room.capacity) * 100);
  }

  occupancyClass(room: ColdRoom): string {
    const pct = this.occupancyPercent(room);
    if (pct >= 90) return 'occupancy-critical';
    if (pct >= 70) return 'occupancy-high';
    return 'occupancy-normal';
  }
}
