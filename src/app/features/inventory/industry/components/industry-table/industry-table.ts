import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Industry } from '../../../../../core/models/industry.model';

@Component({
  selector: 'app-industry-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './industry-table.html',
  styleUrl: './industry-table.scss',
})
export class IndustryTable implements AfterViewInit {
  data = input<Industry[]>([]);

  edit = output<Industry>();
  view = output<Industry>();
  delete = output<Industry>();

  readonly displayedColumns = ['name', 'state', 'actions'];

  dataSource = new MatTableDataSource<Industry>([]);

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
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
