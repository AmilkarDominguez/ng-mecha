import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ServiceOrder, OrderState } from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { ServiceOrderDetailModal } from '../components/service-order-detail-modal/service-order-detail-modal';
import { ServiceOrderPrintModal } from '../components/service-order-print-modal/service-order-print-modal';
import { ServiceOrderPaymentsModal } from '../components/service-order-payments-modal/service-order-payments-modal';

@Component({
  selector: 'app-service-order-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    DecimalPipe,
  ],
  templateUrl: './service-order-dashboard.html',
  styleUrl: './service-order-dashboard.scss',
})
export class ServiceOrderDashboard {
  private orderService = inject(SPServiceOrder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly orders = toSignal(this.orderService.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredOrders = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.orders();
    return this.orders().filter((o) =>
      (o.number ?? '').toLowerCase().includes(term) ||
      this.customerLabel(o).toLowerCase().includes(term),
    );
  });

  readonly columns = ['number', 'customer', 'vehicle', 'total', 'state', 'payment_type', 'started_date', 'actions'];

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onNew(): void {
    this.router.navigate(['/dashboard/ordenes/nueva']);
  }

  onEdit(order: ServiceOrder): void {
    this.router.navigate(['/dashboard/ordenes/editar', order.id]);
  }

  onPrint(order: ServiceOrder): void {
    this.dialog.open(ServiceOrderPrintModal, {
      data: order,
      width: '840px',      // ancho A4 (210mm ≈ 794px) + margen lateral
      maxWidth: '95vw',
      maxHeight: '95vh',
      autoFocus: false,
      panelClass: 'service-order-print-panel',
    });
  }

  onView(order: ServiceOrder): void {
    this.dialog.open(ServiceOrderDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: order,
    });
  }

  onPayments(order: ServiceOrder): void {
    this.dialog.open(ServiceOrderPaymentsModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { order },
    });
  }

  customerLabel(o: ServiceOrder): string {
    const c = o.customer;
    if (!c) return '—';
    return [c.name, c.lastname].filter(Boolean).join(' ') || '—';
  }

  vehicleLabel(o: ServiceOrder): string {
    const v = o.vehicle;
    if (!v) return '—';
    return [v.brand, v.model, v.license_plate].filter(Boolean).join(' ') || '—';
  }

  stateLabel(state: OrderState): string {
    const map: Record<OrderState, string> = {
      IN_PROGRESS: 'En Curso',
      COMPLETED: 'Completado',
      CANCELED: 'Cancelado',
    };
    return map[state];
  }

  stateColor(state: OrderState): string {
    const map: Record<OrderState, string> = {
      IN_PROGRESS: 'primary',
      COMPLETED: 'accent',
      CANCELED: 'warn',
    };
    return map[state];
  }
}
