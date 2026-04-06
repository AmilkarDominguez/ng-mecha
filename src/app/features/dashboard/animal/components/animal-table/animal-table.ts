import { Component, input, output, viewChild, AfterViewInit, OnChanges, effect } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { Animal, AnimalStatus } from '../../../../../core/models/animal.model';

@Component({
  selector: 'app-animal-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe,
  ],
  templateUrl: './animal-table.html',
  styleUrl: './animal-table.scss',
})
export class AnimalTable implements AfterViewInit {
  data = input<Animal[]>([]);
  edit = output<Animal>();
  view = output<Animal>();
  delete = output<Animal>();

  sort = viewChild.required(MatSort);
  paginator = viewChild.required(MatPaginator);

  displayedColumns = ['tag', 'lotNumber', 'rancher', 'breed', 'pen', 'entryWeight', 'status', 'actions'];

  dataSource = new MatTableDataSource<Animal>([]);

  private readonly statusLabels: Record<AnimalStatus, string> = {
    en_corral: 'En Corral',
    en_faena: 'En Faena',
    despachado: 'Despachado',
    muerto: 'Muerto',
    cuarentena: 'Cuarentena',
  };

  private readonly statusClasses: Record<AnimalStatus, string> = {
    en_corral: 'status-pen',
    en_faena: 'status-slaughter',
    despachado: 'status-dispatched',
    muerto: 'status-dead',
    cuarentena: 'status-quarantine',
  };

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
        case 'entryWeight': return item.entryWeight;
        case 'entryDate': return item.entryDate?.getTime() ?? 0;
        default: return (item as unknown as Record<string, unknown>)[property] as string ?? '';
      }
    };
  }

  statusLabel(status: AnimalStatus): string {
    return this.statusLabels[status];
  }

  statusClass(status: AnimalStatus): string {
    return this.statusClasses[status];
  }
}
