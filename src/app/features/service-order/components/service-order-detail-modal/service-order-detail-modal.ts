import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  OrderBatchLine,
  OrderExternalLine,
  OrderServiceLine,
  OrderState,
  ServiceOrder,
  ServiceOrderWithLines,
} from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';
import { DialogFrame } from '../../../../shared/components/dialog-frame/dialog-frame';
import { AddQuoteToOrderModal } from '../add-quote-to-order-modal/add-quote-to-order-modal';

@Component({
  selector: 'app-service-order-detail-modal',
  imports: [
    DatePipe,
    DecimalPipe,
    DialogFrame,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './service-order-detail-modal.html',
  styleUrl: './service-order-detail-modal.scss',
})
export class ServiceOrderDetailModal implements OnInit {
  private dialogRef = inject(MatDialogRef<ServiceOrderDetailModal>);
  private orderService = inject(SPServiceOrder);
  private dialog = inject(MatDialog);
  readonly order: ServiceOrder = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly detail = signal<ServiceOrderWithLines | null>(null);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.loadDetail();
  }

  private loadDetail(): void {
    this.loading.set(true);
    this.orderService.getWithLines(this.order.id).subscribe({
      next: (data) => {
        this.detail.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });
  }

  onAddQuote(): void {
    const ref = this.dialog.open(AddQuoteToOrderModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { order: this.order },
    });
    ref.afterClosed().subscribe((added: boolean) => {
      if (added) this.loadDetail();
    });
  }

  stateLabel(state: OrderState): string {
    const map: Record<OrderState, string> = {
      IN_PROGRESS: 'En Curso',
      COMPLETED: 'Completado',
      CANCELED: 'Cancelado',
    };
    return map[state];
  }

  customerLabel(d: ServiceOrderWithLines): string {
    const c = d.customer;
    if (!c) return '—';
    return [c.name, c.lastname].filter(Boolean).join(' ') || '—';
  }

  vehicleLabel(d: ServiceOrderWithLines): string {
    const v = d.vehicle;
    if (!v) return '—';
    return [v.brand, v.model, v.license_plate].filter(Boolean).join(' ') || '—';
  }

  mechanicLabel(d: ServiceOrderWithLines): string {
    const m = d.mechanic;
    if (!m) return 'Sin asignar';
    return [m.name, m.lastname].filter(Boolean).join(' ') || '—';
  }

  userLabel(d: ServiceOrderWithLines): string {
    const u = d.user;
    if (!u) return 'Sistema';
    return [u.name, u.lastname].filter(Boolean).join(' ') || '—';
  }

  serviceName(line: OrderServiceLine): string {
    return line.service?.name ?? '—';
  }

  batchName(line: OrderBatchLine): string {
    return line.batch?.product?.name ?? line.batch?.description ?? '—';
  }

  externalServiceName(line: OrderExternalLine): string {
    return line.external_service?.name ?? '—';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
