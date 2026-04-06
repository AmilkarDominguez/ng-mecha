import { Component, input, output, viewChild, AfterViewInit, OnChanges } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { MovementGuide, GuideStatus } from '../../../../../core/models/movement-guide.model';

@Component({
  selector: 'app-movement-guide-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    DatePipe,
  ],
  templateUrl: './movement-guide-table.html',
  styleUrl: './movement-guide-table.scss',
})
export class MovementGuideTable implements AfterViewInit, OnChanges {
  data = input<MovementGuide[]>([]);
  edit = output<MovementGuide>();
  view = output<MovementGuide>();
  delete = output<MovementGuide>();

  private sort = viewChild.required(MatSort);
  private paginator = viewChild.required(MatPaginator);

  displayedColumns = ['guideNumber', 'rancher', 'carrier', 'vehiclePlate', 'animalCount', 'status', 'issueDate', 'actions'];

  dataSource = new MatTableDataSource<MovementGuide>([]);

  private readonly guideStatusLabels: Record<GuideStatus, string> = {
    pendiente: 'Pendiente',
    recibida: 'Recibida',
    observada: 'Observada',
    rechazada: 'Rechazada',
  };

  private readonly guideStatusColors: Record<GuideStatus, string> = {
    pendiente: 'status-pending',
    recibida: 'status-received',
    observada: 'status-observed',
    rechazada: 'status-rejected',
  };

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'issueDate': return item.issueDate?.getTime() ?? 0;
        case 'animalCount': return item.animalCount;
        default: return (item as unknown as Record<string, unknown>)[property] as string ?? '';
      }
    };
  }

  ngOnChanges(): void {
    this.dataSource.data = this.data();
    if (this.paginator()) this.dataSource.paginator = this.paginator();
  }

  statusLabel(status: GuideStatus): string {
    return this.guideStatusLabels[status];
  }

  statusClass(status: GuideStatus): string {
    return this.guideStatusColors[status];
  }
}
