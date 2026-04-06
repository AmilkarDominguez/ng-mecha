import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Label } from '../../../../../core/models/label.model';

@Component({
  selector: 'app-label-table',
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
  templateUrl: './label-table.html',
  styleUrl: './label-table.scss',
})
export class LabelTable implements AfterViewInit {
  data = input<Label[]>([]);

  edit = output<Label>();
  view = output<Label>();
  delete = output<Label>();
  print = output<Label>();

  readonly displayedColumns = [
    'labelCode',
    'labelType',
    'printedAt',
    'animalTag',
    'rancher',
    'weight',
    'printedBy',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<Label>([]);

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
        case 'labelCode': return item.labelCode;
        case 'labelType': return item.labelType;
        case 'printedAt': return item.printedAt.getTime();
        case 'animalTag': return item.animalTag.toLowerCase();
        case 'rancher': return item.rancher.toLowerCase();
        case 'weight': return item.weight ?? -1;
        case 'printedBy': return item.printedBy.toLowerCase();
        case 'status': return item.status;
        default: return '';
      }
    };
  }

  labelTypeDisplay(type: string): string {
    const map: Record<string, string> = {
      etiqueta_1: 'Etiqueta 1',
      etiqueta_2: 'Etiqueta 2',
      etiqueta_3: 'Etiqueta 3',
    };
    return map[type] ?? type;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      impresa: 'Impresa',
      anulada: 'Anulada',
      reimpresa: 'Reimpresa',
    };
    return map[status] ?? status;
  }
}
