import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { QuoteExternalServiceRow } from '../../../../core/models/quote.model';

@Component({
  selector: 'app-quote-external-services-table',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    DecimalPipe,
  ],
  templateUrl: './quote-external-services-table.html',
  styleUrl: './quote-external-services-table.scss',
})
export class QuoteExternalServicesTable {
  private snackBar = inject(MatSnackBar);

  items = input<QuoteExternalServiceRow[]>([]);
  removeItem = output<string>();

  readonly columns = ['item', 'description', 'cost', 'price', 'quantity', 'subtotal', 'actions'];

  getSubtotal(row: QuoteExternalServiceRow): number {
    return (row.price ?? 0) * (row.quantity ?? 1);
  }

  onCostChange(row: QuoteExternalServiceRow, value: string): void {
    row.cost = parseFloat(value) || 0;
  }

  onPriceChange(row: QuoteExternalServiceRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
  }

  onQuantityChange(row: QuoteExternalServiceRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Servicio externo eliminado', 'Cerrar', { duration: 2500 });
  }
}
