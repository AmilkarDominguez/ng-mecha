import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Mechanic } from '../../../../../core/models/mechanic.model';

@Component({
  selector: 'app-mechanic-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './mechanic-table.html',
  styleUrl: './mechanic-table.scss',
})
export class MechanicTable implements AfterViewInit {
  data = input<Mechanic[]>([]);

  edit = output<Mechanic>();
  view = output<Mechanic>();
  delete = output<Mechanic>();

  readonly displayedColumns = ['fullName', 'ci', 'phone', 'email', 'birthdate', 'state', 'actions'];

  dataSource = new MatTableDataSource<Mechanic>([]);

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
        case 'fullName': return `${item.name ?? ''} ${item.lastname ?? ''}`.toLowerCase();
        case 'ci': return (item.ci ?? '').toLowerCase();
        case 'phone': return (item.phone ?? '').toLowerCase();
        case 'email': return (item.email ?? '').toLowerCase();
        case 'birthdate': return item.birthdate ?? '';
        case 'state': return item.state;
        default: return '';
      }
    };
  }

  fullName(mechanic: Mechanic): string {
    const parts = [mechanic.name, mechanic.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }
}
