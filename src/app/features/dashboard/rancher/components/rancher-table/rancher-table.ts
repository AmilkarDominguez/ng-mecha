import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Rancher } from '../../../../../core/models/rancher.model';

@Component({
  selector: 'app-rancher-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './rancher-table.html',
  styleUrl: './rancher-table.scss',
})
export class RancherTable implements AfterViewInit {
  data = input<Rancher[]>([]);

  edit = output<Rancher>();
  view = output<Rancher>();
  delete = output<Rancher>();

  readonly displayedColumns = ['businessName', 'taxId', 'phone', 'email', 'isActive', 'actions'];

  dataSource = new MatTableDataSource<Rancher>([]);

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
        case 'businessName': return item.businessName.toLowerCase();
        case 'taxId': return item.taxId;
        case 'phone': return item.phone;
        case 'email': return item.email;
        case 'isActive': return item.isActive ? 1 : 0;
        default: return '';
      }
    };
  }
}
