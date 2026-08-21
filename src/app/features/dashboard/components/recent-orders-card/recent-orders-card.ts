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
import { ServiceOrderDetailModal } from '../../../service-order/components/service-order-detail-modal/service-order-detail-modal';

const RECENT_N = 5;

const STATE_LABELS: Record<ServiceOrder['state'], string> = {
  IN_PROGRESS: 'En Curso',
  COMPLETED: 'Completada',
  CANCELED: 'Cancelada',
};

@Component({
  selector: 'app-recent-orders-card',
  imports: [DecimalPipe, MatCardModule, MatIconModule, MatDividerModule, MatTooltipModule],
  templateUrl: './recent-orders-card.html',
  styleUrl: './recent-orders-card.scss',
})
export class RecentOrdersCard {
  private dialog = inject(MatDialog);
  private serviceOrderProvider = inject(SPServiceOrder);

  private readonly orders = toSignal(this.serviceOrderProvider.listen(), { initialValue: [] as ServiceOrder[] });

  // listen()/get() ya ordenan por created_at DESC — tomar los primeros N
  // alcanza para "recientes" sin re-ordenar en el cliente.
  readonly recentOrders = computed(() => this.orders().slice(0, RECENT_N));

  customerLabel(order: ServiceOrder): string {
    if (!order.customer) return '—';
    return [order.customer.name, order.customer.lastname].filter(Boolean).join(' ');
  }

  vehicleLabel(order: ServiceOrder): string {
    if (!order.vehicle) return '—';
    return [order.vehicle.brand, order.vehicle.model].filter(Boolean).join(' ');
  }

  stateLabel(order: ServiceOrder): string {
    return STATE_LABELS[order.state];
  }

  openDetail(order: ServiceOrder): void {
    this.dialog.open(ServiceOrderDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: order,
    });
  }
}
