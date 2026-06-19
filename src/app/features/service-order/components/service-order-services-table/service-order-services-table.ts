import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ServiceOrderServiceRow } from '../../../../core/models/service-order.model';

@Component({
  selector: 'app-service-order-services-table',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    DecimalPipe,
  ],
  templateUrl: './service-order-services-table.html',
  styleUrl: './service-order-services-table.scss',
})
export class ServiceOrderServicesTable {
  private snackBar = inject(MatSnackBar);

  items = input<ServiceOrderServiceRow[]>([]);
  removeItem = output<string>();

  readonly columns = ['item', 'description', 'price', 'quantity', 'discount', 'subtotal', 'actions'];

  getSubtotal(row: ServiceOrderServiceRow): number {
    const base = (row.price ?? 0) * (row.quantity ?? 1);
    const discountAmt = base * ((row.discount ?? 0) / 100);
    return base - discountAmt;
  }

  onPriceChange(row: ServiceOrderServiceRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
  }

  onQuantityChange(row: ServiceOrderServiceRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
  }

  onDiscountChange(row: ServiceOrderServiceRow, value: string): void {
    const d = parseFloat(value) || 0;
    row.discount = Math.min(100, Math.max(0, d));
    row.subtotal = this.getSubtotal(row);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Servicio eliminado', 'Cerrar', { duration: 2500 });
  }
}
