import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Pen, PenType } from '../../../../../core/models/pen.model';

@Component({
  selector: 'app-pen-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './pen-table.html',
  styleUrl: './pen-table.scss',
})
export class PenTable implements AfterViewInit {
  data = input<Pen[]>([]);

  edit = output<Pen>();
  view = output<Pen>();
  delete = output<Pen>();

  readonly displayedColumns = ['name', 'code', 'type', 'capacity', 'isActive', 'actions'];

  readonly penTypeLabels: Record<PenType, string> = {
    cuarentena: 'Cuarentena',
    espera: 'Espera',
    faena: 'Pre-Faena',
    descanso: 'Descanso',
    enfermeria: 'Enfermería',
  };

  dataSource = new MatTableDataSource<Pen>([]);

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
        case 'type': return item.type;
        case 'capacity': return item.capacity;
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }

  typeLabel(type: PenType): string {
    return this.penTypeLabels[type];
  }

  occupancyPercent(pen: Pen): number {
    if (pen.capacity === 0) return 0;
    return Math.round((pen.currentOccupancy / pen.capacity) * 100);
  }

  occupancyClass(pen: Pen): string {
    const pct = this.occupancyPercent(pen);
    if (pct >= 90) return 'occupancy-critical';
    if (pct >= 70) return 'occupancy-high';
    return 'occupancy-normal';
  }
}
