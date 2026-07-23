import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ServiceOrder, ServiceOrderWithLines } from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';
import { WorkshopSettings } from '../../../../core/models/workshop-settings.model';
import { SPWorkshopSettings } from '../../../../core/services/supabase/sb-workshop-settings';

const IVA_RATE = 0.13;

@Component({
  selector: 'app-service-order-print-modal',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
  ],
  templateUrl: './service-order-print-modal.html',
  styleUrl: './service-order-print-modal.scss',
})
export class ServiceOrderPrintModal implements OnInit {
  private orderService     = inject(SPServiceOrder);
  private settingsService  = inject(SPWorkshopSettings);
  private dialogRef        = inject(MatDialogRef<ServiceOrderPrintModal>);
  readonly data            = inject<ServiceOrder>(MAT_DIALOG_DATA);

  readonly loading  = signal(true);
  readonly hasError = signal(false);
  readonly detail   = signal<ServiceOrderWithLines | null>(null);
  readonly settings = signal<WorkshopSettings | null>(null);

  readonly subtotalServices = computed(() =>
    (this.detail()?.order_services ?? []).reduce((s, l) => s + (l.subtotal ?? 0), 0),
  );

  readonly subtotalParts = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    const batches   = d.order_batches.reduce((s, l) => s + (l.subtotal ?? 0), 0);
    const externals = d.order_externals.reduce((s, l) => s + (l.subtotal ?? 0), 0);
    return batches + externals;
  });

  // Base sin IVA
  readonly subtotalSinIva = computed(() => this.detail()?.total ?? 0);

  // IVA - IT (13 %). Usa el valor guardado; si falta, lo calcula sobre la base.
  readonly ivaIt = computed(() => {
    const d = this.detail();
    if (!d || !d.with_iva) return 0;
    return d.iva ?? (d.total ?? 0) * IVA_RATE;
  });

  // Total final: con IVA usa total_iva; sin IVA es la base.
  readonly totalFinal = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    return d.with_iva ? (d.total_iva ?? (d.total ?? 0) + this.ivaIt()) : (d.total ?? 0);
  });

  ngOnInit(): void {
    this.orderService.getWithLines(this.data.id).subscribe({
      next: (order) => {
        this.detail.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });

    this.settingsService.get().subscribe((settings) => this.settings.set(settings));
  }

  customerName(): string {
    const d = this.detail();
    if (!d?.customer) return '—';
    return [d.customer.name, d.customer.lastname].filter(Boolean).join(' ');
  }

  vehicleDesc(): string {
    const v = this.detail()?.vehicle;
    if (!v) return '—';
    return [v.brand, v.model].filter(Boolean).join('/ ');
  }

  mechanicName(): string {
    const m = this.detail()?.mechanic;
    if (!m) return '—';
    return [m.name, m.lastname].filter(Boolean).join(' ').toUpperCase();
  }

  orderNumber(): string {
    const d = this.detail();
    if (!d) return '';
    return d.number ? `#${d.number}` : `#${d.id.slice(0, 8).toUpperCase()}`;
  }

  serviceTotal(subtotal: number | null): string {
    return subtotal && subtotal > 0 ? subtotal.toFixed(2) : '-';
  }

  onPrint(): void {
    window.print();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
