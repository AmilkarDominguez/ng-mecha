import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BankAccountHistory } from '../../../../../core/models/bank-account-history.model';

@Component({
  selector: 'app-expense-register-table',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './expense-register-table.html',
  styleUrl: './expense-register-table.scss',
})
export class ExpenseRegisterTable implements AfterViewInit {
  data = input<BankAccountHistory[]>([]);

  edit = output<BankAccountHistory>();
  delete = output<BankAccountHistory>();

  readonly displayedColumns = ['created_at', 'bank_account', 'transaction_type', 'concept', 'amount', 'actions'];

  dataSource = new MatTableDataSource<BankAccountHistory>([]);

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
        case 'created_at': return item.created_at ? new Date(item.created_at).getTime() : 0;
        case 'bank_account': return (item.bank_account?.name ?? '').toLowerCase();
        case 'transaction_type': return (item.transaction_type?.name ?? '').toLowerCase();
        case 'amount': return item.amount ?? 0;
        default: return '';
      }
    };
  }
}
