import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User, UserRole } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-user-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss',
})
export class UserTable implements AfterViewInit {
  data = input<User[]>([]);

  edit = output<User>();
  view = output<User>();
  delete = output<User>();

  readonly displayedColumns = ['fullName', 'username', 'role', 'email', 'isActive', 'actions'];

  private readonly roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    operador: 'Operador',
    auditor: 'Auditor',
    visualizador: 'Visualizador',
  };

  dataSource = new MatTableDataSource<User>([]);

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
        case 'fullName': return `${item.firstName} ${item.lastName}`.toLowerCase();
        case 'username': return item.username.toLowerCase();
        case 'role': return item.role;
        case 'email': return item.email.toLowerCase();
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }

  roleLabel(role: UserRole): string {
    return this.roleLabels[role];
  }

  fullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}
