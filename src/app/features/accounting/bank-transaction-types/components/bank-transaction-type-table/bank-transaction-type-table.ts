import { AfterViewInit, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BankTransactionType } from '../../../../../core/models/bank-transaction-type.model';

@Component({
  selector: 'app-bank-transaction-type-table',
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './bank-transaction-type-table.html',
  styleUrl: './bank-transaction-type-table.scss',
})
export class BankTransactionTypeTable implements AfterViewInit {
  data = input<BankTransactionType[]>([]);

  edit = output<BankTransactionType>();
  view = output<BankTransactionType>();
  delete = output<BankTransactionType>();

  readonly displayedColumns = ['name', 'type', 'state', 'actions'];

  dataSource = new MatTableDataSource<BankTransactionType>([]);

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
        case 'type': return item.type ?? '';
        case 'state': return item.state;
        default: return '';
      }
    };
  }

  typeLabel(type: string | null): string {
    if (type === 'INCOME') return 'Ingreso';
    if (type === 'EXPENSE') return 'Egreso';
    return '—';
  }
}
