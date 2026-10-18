import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { QuoteBatchRow } from '../../../../core/models/quote.model';
import { DeliveryTime } from '../../../../core/models/service-order.model';

@Component({
  selector: 'app-quote-batches-table',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    DecimalPipe,
  ],
  templateUrl: './quote-batches-table.html',
  styleUrl: './quote-batches-table.scss',
})
export class QuoteBatchesTable {
  private snackBar = inject(MatSnackBar);

  items = input<QuoteBatchRow[]>([]);
  removeItem = output<string>();
  itemsChange = output<QuoteBatchRow[]>();

  readonly columns = ['item', 'description', 'price', 'quantity', 'delivery_time', 'discount', 'subtotal', 'actions'];

  getSubtotal(row: QuoteBatchRow): number {
    const base = (row.price ?? 0) * (row.quantity ?? 1);
    return Math.max(0, base - (row.discount ?? 0));
  }

  onPriceChange(row: QuoteBatchRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
    this.itemsChange.emit([...this.items()]);
  }

  onQuantityChange(row: QuoteBatchRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
    this.itemsChange.emit([...this.items()]);
  }

  onDiscountChange(row: QuoteBatchRow, value: string): void {
    row.discount = Math.max(0, parseFloat(value) || 0);
    row.subtotal = this.getSubtotal(row);
    this.itemsChange.emit([...this.items()]);
  }

  onDeliveryTimeChange(row: QuoteBatchRow, value: DeliveryTime): void {
    row.delivery_time = value;
    this.itemsChange.emit([...this.items()]);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Repuesto eliminado', 'Cerrar', { duration: 2500 });
  }
}
