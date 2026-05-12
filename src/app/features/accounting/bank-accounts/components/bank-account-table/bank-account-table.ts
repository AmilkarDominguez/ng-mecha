import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BankAccount } from '../../../../../core/models/bank-account.model';

@Component({
  selector: 'app-bank-account-table',
  imports: [
    CurrencyPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './bank-account-table.html',
  styleUrl: './bank-account-table.scss',
})
export class BankAccountTable implements AfterViewInit {
  data = input<BankAccount[]>([]);

  edit = output<BankAccount>();
  view = output<BankAccount>();
  delete = output<BankAccount>();

  readonly displayedColumns = ['name', 'number', 'balance', 'state', 'actions'];

  dataSource = new MatTableDataSource<BankAccount>([]);

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
        case 'name': return (item.name ?? '').toLowerCase();
        case 'number': return (item.number ?? '').toLowerCase();
        case 'balance': return item.balance ?? 0;
        case 'state': return item.state;
        default: return '';
      }
    };
  }
}
