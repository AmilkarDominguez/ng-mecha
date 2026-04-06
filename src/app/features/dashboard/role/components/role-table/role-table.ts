import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Role } from '../../../../../core/models/role.model';

@Component({
  selector: 'app-role-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './role-table.html',
  styleUrl: './role-table.scss',
})
export class RoleTable implements AfterViewInit {
  data = input<Role[]>([]);

  edit = output<Role>();
  view = output<Role>();
  delete = output<Role>();

  readonly displayedColumns = ['name', 'code', 'permissionCount', 'isActive', 'actions'];

  dataSource = new MatTableDataSource<Role>([]);

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
        case 'permissionCount': return item.permissions.length;
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }

  permissionCount(role: Role): number {
    return role.permissions.length;
  }
}
