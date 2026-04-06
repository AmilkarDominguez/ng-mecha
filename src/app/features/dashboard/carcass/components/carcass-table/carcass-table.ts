import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Carcass } from '../../../../../core/models/carcass.model';

@Component({
  selector: 'app-carcass-table',
  imports: [
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './carcass-table.html',
  styleUrl: './carcass-table.scss',
})
export class CarcassTable implements AfterViewInit {
  data = input<Carcass[]>([]);

  edit = output<Carcass>();
  view = output<Carcass>();
  delete = output<Carcass>();

  readonly displayedColumns = [
    'carcassCode',
    'slaughterDate',
    'animalTag',
    'rancher',
    'hotWeight',
    'coldWeight',
    'coldRoomAssigned',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<Carcass>([]);

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
        case 'carcassCode': return item.carcassCode;
        case 'slaughterDate': return item.slaughterDate.getTime();
        case 'animalTag': return item.animalTag.toLowerCase();
        case 'rancher': return item.rancher.toLowerCase();
        case 'hotWeight': return item.hotWeight;
        case 'coldWeight': return item.coldWeight ?? -1;
        case 'coldRoomAssigned': return item.coldRoomAssigned.toLowerCase();
        case 'status': return item.status;
        default: return '';
      }
    };
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      en_camara: 'En Cámara',
      despachado: 'Despachado',
      decomisada: 'Decomisada',
    };
    return map[status] ?? status;
  }
}
