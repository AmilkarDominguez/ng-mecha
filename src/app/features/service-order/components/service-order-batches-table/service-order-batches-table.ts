import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { ServiceOrderBatchRow, DeliveryTime } from '../../../../core/models/service-order.model';

@Component({
  selector: 'app-service-order-batches-table',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    DecimalPipe,
  ],
  templateUrl: './service-order-batches-table.html',
  styleUrl: './service-order-batches-table.scss',
})
export class ServiceOrderBatchesTable {
  private snackBar = inject(MatSnackBar);

  items = input<ServiceOrderBatchRow[]>([]);
  removeItem = output<string>();
  itemsChange = output<ServiceOrderBatchRow[]>();

  readonly columns = ['item', 'description', 'price', 'quantity', 'delivery_time', 'discount', 'subtotal', 'actions'];

  getSubtotal(row: ServiceOrderBatchRow): number {
    const base = (row.price ?? 0) * (row.quantity ?? 1);
    return Math.max(0, base - (row.discount ?? 0));
  }

  onPriceChange(row: ServiceOrderBatchRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
    this.itemsChange.emit([...this.items()]);
  }

  onQuantityChange(row: ServiceOrderBatchRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
    this.itemsChange.emit([...this.items()]);
  }

  onDiscountChange(row: ServiceOrderBatchRow, value: string): void {
    row.discount = Math.max(0, parseFloat(value) || 0);
    row.subtotal = this.getSubtotal(row);
    this.itemsChange.emit([...this.items()]);
  }

  onDeliveryTimeChange(row: ServiceOrderBatchRow, value: DeliveryTime): void {
    row.delivery_time = value;
    this.itemsChange.emit([...this.items()]);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Repuesto eliminado', 'Cerrar', { duration: 2500 });
  }
}
