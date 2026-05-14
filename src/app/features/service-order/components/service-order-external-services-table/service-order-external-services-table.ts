import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { ServiceOrderExternalServiceRow } from '../../../../core/models/service-order.model';

@Component({
  selector: 'app-service-order-external-services-table',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    DecimalPipe,
  ],
  templateUrl: './service-order-external-services-table.html',
  styleUrl: './service-order-external-services-table.scss',
})
export class ServiceOrderExternalServicesTable {
  private snackBar = inject(MatSnackBar);

  items = input<ServiceOrderExternalServiceRow[]>([]);
  removeItem = output<string>();

  readonly columns = ['item', 'description', 'cost', 'price', 'quantity', 'subtotal', 'actions'];

  getSubtotal(row: ServiceOrderExternalServiceRow): number {
    return (row.price ?? 0) * (row.quantity ?? 1);
  }

  onCostChange(row: ServiceOrderExternalServiceRow, value: string): void {
    row.cost = parseFloat(value) || 0;
  }

  onPriceChange(row: ServiceOrderExternalServiceRow, value: string): void {
    row.price = parseFloat(value) || 0;
    row.subtotal = this.getSubtotal(row);
  }

  onQuantityChange(row: ServiceOrderExternalServiceRow, value: string): void {
    row.quantity = parseInt(value, 10) || 1;
    row.subtotal = this.getSubtotal(row);
  }

  onRemove(id: string): void {
    this.removeItem.emit(id);
    this.snackBar.open('Trabajo adicional eliminado', 'Cerrar', { duration: 2500 });
  }
}
