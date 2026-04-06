import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OwnershipTransfer } from '../../../../../core/models/ownership-transfer.model';

@Component({
  selector: 'app-ownership-transfer-table',
  imports: [
    DatePipe,
    SlicePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './ownership-transfer-table.html',
  styleUrl: './ownership-transfer-table.scss',
})
export class OwnershipTransferTable implements AfterViewInit {
  data = input<OwnershipTransfer[]>([]);

  edit = output<OwnershipTransfer>();
  view = output<OwnershipTransfer>();
  delete = output<OwnershipTransfer>();

  readonly displayedColumns = ['animalTag', 'transfer', 'reason', 'transferredAt', 'registeredByName', 'actions'];

  dataSource = new MatTableDataSource<OwnershipTransfer>([]);

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
        case 'animalTag': return item.animalTag.toLowerCase();
        case 'transfer': return item.fromRancherName.toLowerCase();
        case 'reason': return item.reason.toLowerCase();
        case 'transferredAt': return item.transferredAt.getTime();
        case 'registeredByName': return item.registeredByName.toLowerCase();
        default: return '';
      }
    };
  }
}
