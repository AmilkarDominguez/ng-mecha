import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Gender } from '../../../../../core/models/gender.model';

@Component({
  selector: 'app-gender-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './gender-table.html',
  styleUrl: './gender-table.scss',
})
export class GenderTable implements AfterViewInit {
  data = input<Gender[]>([]);

  edit = output<Gender>();
  view = output<Gender>();
  delete = output<Gender>();

  readonly displayedColumns = ['name', 'code', 'isActive', 'actions'];

  dataSource = new MatTableDataSource<Gender>([]);

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
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }
}
