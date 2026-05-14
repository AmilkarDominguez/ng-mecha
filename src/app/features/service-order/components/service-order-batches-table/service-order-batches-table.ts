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

  readonly columns = ['item', 'description', 'industry', 'price', 'quantity', 'delivery_time', 'discount', 'subtotal', 'actions'];

  getSubtotal(row: ServiceOrderBatchRow): number {
    const base = (row.price ?? 0) * (row.quantity ?? 1);
    const discountAmt = base * ((row.discount ?? 0) / 100);
    return base - discountAmt;
  }

  onPriceChange(row: ServiceOrderBatchRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
  }

  onQuantityChange(row: ServiceOrderBatchRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
  }

  onDiscountChange(row: ServiceOrderBatchRow, value: string): void {
    const d = parseFloat(value) || 0;
    row.discount = Math.min(100, Math.max(0, d));
    row.subtotal = this.getSubtotal(row);
  }

  onDeliveryTimeChange(row: ServiceOrderBatchRow, value: DeliveryTime): void {
    row.delivery_time = value;
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Repuesto eliminado', 'Cerrar', { duration: 2500 });
  }
}
