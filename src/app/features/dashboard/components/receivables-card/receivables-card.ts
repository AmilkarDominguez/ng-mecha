import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ServiceOrder } from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';
import { ServiceOrderPaymentsModal } from '../../../service-order/components/service-order-payments-modal/service-order-payments-modal';

@Component({
  selector: 'app-receivables-card',
  imports: [DecimalPipe, MatCardModule, MatIconModule, MatDividerModule, MatTooltipModule],
  templateUrl: './receivables-card.html',
  styleUrl: './receivables-card.scss',
})
export class ReceivablesCard {
  private dialog = inject(MatDialog);
  private serviceOrderProvider = inject(SPServiceOrder);

  private readonly orders = toSignal(this.serviceOrderProvider.listen(), { initialValue: [] as ServiceOrder[] });

  readonly pendingOrders = computed(() =>
    this.orders()
      .filter((o) => o.state !== 'CANCELED' && (o.must ?? 0) > 0)
      .sort((a, b) => (b.must ?? 0) - (a.must ?? 0)),
  );

  readonly totalPending = computed(() => this.pendingOrders().reduce((acc, o) => acc + (o.must ?? 0), 0));

  customerLabel(order: ServiceOrder): string {
    if (!order.customer) return '—';
    return [order.customer.name, order.customer.lastname].filter(Boolean).join(' ');
  }

  openPayments(order: ServiceOrder): void {
    this.dialog.open(ServiceOrderPaymentsModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { order },
    });
  }
}
