import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { Quote } from '../../../../core/models/quote.model';

@Component({
  selector: 'app-service-order-quotes-table',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule, DecimalPipe],
  templateUrl: './service-order-quotes-table.html',
  styleUrl: './service-order-quotes-table.scss',
})
export class ServiceOrderQuotesTable {
  private snackBar = inject(MatSnackBar);

  items = input<Quote[]>([]);
  removeItem = output<string>();

  readonly columns = ['item', 'number', 'expiration', 'total', 'actions'];

  quoteLabel(q: Quote): string {
    return q.number ?? q.id.slice(0, 8);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Cotización quitada de la orden', 'Cerrar', { duration: 2500 });
  }
}
