import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SlaughterRecord } from '../../../../../core/models/slaughter-record.model';

@Component({
  selector: 'app-slaughter-record-table',
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
  templateUrl: './slaughter-record-table.html',
  styleUrl: './slaughter-record-table.scss',
})
export class SlaughterRecordTable implements AfterViewInit {
  data = input<SlaughterRecord[]>([]);

  edit = output<SlaughterRecord>();
  view = output<SlaughterRecord>();
  delete = output<SlaughterRecord>();

  readonly displayedColumns = [
    'recordNumber',
    'slaughterDate',
    'animalTag',
    'rancher',
    'hotWeight',
    'inspectionResult',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<SlaughterRecord>([]);

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
        case 'recordNumber': return item.recordNumber;
        case 'slaughterDate': return item.slaughterDate.getTime();
        case 'animalTag': return item.animalTag.toLowerCase();
        case 'rancher': return item.rancher.toLowerCase();
        case 'hotWeight': return item.hotWeight;
        case 'inspectionResult': return item.inspectionResult;
        case 'status': return item.status;
        default: return '';
      }
    };
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      procesado: 'Procesado',
      en_camara: 'En Cámara',
      despachado: 'Despachado',
    };
    return map[status] ?? status;
  }

  inspectionLabel(result: string): string {
    const map: Record<string, string> = {
      aprobado: 'Aprobado',
      observado: 'Observado',
      rechazado: 'Rechazado',
    };
    return map[result] ?? result;
  }
}
