import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { QuoteServiceRow } from '../../../../core/models/quote.model';

@Component({
  selector: 'app-quote-services-table',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    DecimalPipe,
  ],
  templateUrl: './quote-services-table.html',
  styleUrl: './quote-services-table.scss',
})
export class QuoteServicesTable {
  private snackBar = inject(MatSnackBar);

  items = input<QuoteServiceRow[]>([]);
  removeItem = output<string>();

  readonly columns = ['item', 'description', 'price', 'quantity', 'discount', 'subtotal', 'actions'];

  getSubtotal(row: QuoteServiceRow): number {
    const base = (row.price ?? 0) * (row.quantity ?? 1);
    const discountAmt = base * ((row.discount ?? 0) / 100);
    return base - discountAmt;
  }

  onPriceChange(row: QuoteServiceRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
  }

  onQuantityChange(row: QuoteServiceRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
  }

  onDiscountChange(row: QuoteServiceRow, value: string): void {
    const d = parseFloat(value) || 0;
    row.discount = Math.min(100, Math.max(0, d));
    row.subtotal = this.getSubtotal(row);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Servicio eliminado', 'Cerrar', { duration: 2500 });
  }
}
