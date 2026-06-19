import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { TabCustomer, CustomerTabValue } from '../components/tab-customer/tab-customer';
import { TabLabor } from '../components/tab-labor/tab-labor';
import { TabParts } from '../components/tab-parts/tab-parts';
import { TabExternal } from '../components/tab-external/tab-external';
import { ServiceOrderServicesTable } from '../components/service-order-services-table/service-order-services-table';
import { ServiceOrderBatchesTable } from '../components/service-order-batches-table/service-order-batches-table';
import { ServiceOrderExternalServicesTable } from '../components/service-order-external-services-table/service-order-external-services-table';
import {
  ServiceOrderServiceRow,
  ServiceOrderBatchRow,
  ServiceOrderExternalServiceRow,
} from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';

const IVA_RATE = 0.13;

@Component({
  selector: 'app-service-order-form',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    DecimalPipe,
    TabCustomer,
    TabLabor,
    TabParts,
    TabExternal,
    ServiceOrderServicesTable,
    ServiceOrderBatchesTable,
    ServiceOrderExternalServicesTable,
  ],
  templateUrl: './service-order-form.html',
  styleUrl: './service-order-form.scss',
})
export class ServiceOrderForm {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  readonly customerTabValue = signal<CustomerTabValue | null>(null);

  readonly serviceRows = signal<ServiceOrderServiceRow[]>([]);
  readonly batchRows = signal<ServiceOrderBatchRow[]>([]);
  readonly externalRows = signal<ServiceOrderExternalServiceRow[]>([]);

  readonly summaryForm = new FormGroup({
    number: new FormControl<string>(''),
    payment_type: new FormControl<'CASH' | 'CREDIT'>('CASH'),
    with_iva: new FormControl<boolean>(false),
    description: new FormControl<string>(''),
    return_date: new FormControl<Date | null>(null),
  });

  readonly subtotalServices = computed(() =>
    this.serviceRows().reduce((acc, r) => {
      const base = (r.price ?? 0) * (r.quantity ?? 1);
      const discount = base * ((r.discount ?? 0) / 100);
      return acc + base - discount;
    }, 0),
  );

  readonly subtotalBatches = computed(() =>
    this.batchRows().reduce((acc, r) => {
      const base = (r.price ?? 0) * (r.quantity ?? 1);
      const discount = base * ((r.discount ?? 0) / 100);
      return acc + base - discount;
    }, 0),
  );

  readonly subtotalExternal = computed(() =>
    this.externalRows().reduce((acc, r) => acc + (r.price ?? 0) * (r.quantity ?? 1), 0),
  );

  readonly total = computed(
    () => this.subtotalServices() + this.subtotalBatches() + this.subtotalExternal(),
  );

  readonly ivaAmount = computed(() => {
    const withIva = this.summaryForm.value.with_iva;
    return withIva ? this.total() * IVA_RATE : 0;
  });

  readonly totalWithIva = computed(() => this.total() + this.ivaAmount());

  onCustomerTabChange(value: CustomerTabValue): void {
    this.customerTabValue.set(value);
  }

  onAddService(row: ServiceOrderServiceRow): void {
    this.serviceRows.update((rows) => [...rows, row]);
  }

  onRemoveService(id: string): void {
    this.serviceRows.update((rows) => rows.filter((r) => r.id !== id));
  }

  onAddBatch(row: ServiceOrderBatchRow): void {
    this.batchRows.update((rows) => [...rows, row]);
  }

  onRemoveBatch(id: string): void {
    this.batchRows.update((rows) => rows.filter((r) => r.id !== id));
  }

  onAddExternal(row: ServiceOrderExternalServiceRow): void {
    this.externalRows.update((rows) => [...rows, row]);
  }

  onRemoveExternal(id: string): void {
    this.externalRows.update((rows) => rows.filter((r) => r.id !== id));
  }

  onSave(): void {
    const tab = this.customerTabValue();
    if (!tab?.customer_id) {
      this.snackBar.open('Debe seleccionar un cliente', 'Cerrar', { duration: 3000 });
      return;
    }

    const raw = this.summaryForm.value;
    const withIva = raw.with_iva ?? false;

    const payload = {
      customer_id: tab.customer_id,
      vehicle_id: tab.vehicle_id,
      mechanic_id: tab.mechanic_id,
      user_id: null,
      number: raw.number || null,
      description: raw.description || null,
      total: this.total(),
      have: 0,
      must: this.totalWithIva(),
      iva: withIva ? this.ivaAmount() : null,
      total_iva: withIva ? this.totalWithIva() : null,
      with_iva: withIva,
      mileage: tab.mileage,
      draft_expiration_date: null,
      started_date: tab.started_date,
      ended_date: tab.ended_date,
      return_date: raw.return_date ? raw.return_date.toISOString().split('T')[0] : null,
      state: 'IN_PROGRESS' as const,
      payment_type: raw.payment_type ?? 'CASH',
    };

    this.serviceOrderProvider.add(payload).subscribe({
      next: (order) => {
        const orderId = order.id;

        const servicesToSave = this.serviceRows().map((r) => ({
          service_id: r.service_id,
          service_order_id: orderId,
          price: r.price,
          quantity: r.quantity,
          discount: r.discount,
          subtotal: r.subtotal,
        }));

        const batchesToSave = this.batchRows().map((r) => ({
          batch_id: r.batch_id,
          service_order_id: orderId,
          quantity: r.quantity,
          delivery_time: r.delivery_time,
          price: r.price,
          discount: r.discount,
          subtotal: r.subtotal,
        }));

        const externalToSave = this.externalRows().map((r) => ({
          external_service_id: r.external_service_id,
          service_order_id: orderId,
          bank_account_id: r.bank_account_id,
          cost: r.cost,
          price: r.price,
          quantity: r.quantity,
          subtotal: r.subtotal,
        }));

        const saves: Observable<unknown>[] = [];
        if (servicesToSave.length > 0) saves.push(this.serviceOrderProvider.bulkAddServices(servicesToSave) as Observable<unknown>);
        if (batchesToSave.length > 0) saves.push(this.serviceOrderProvider.bulkAddBatches(batchesToSave) as Observable<unknown>);
        if (externalToSave.length > 0) saves.push(this.serviceOrderProvider.bulkAddExternalServices(externalToSave) as Observable<unknown>);

        if (saves.length === 0) {
          this.snackBar.open('Orden registrada correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard/ordenes/en-curso']);
          return;
        }

        let pending = saves.length;
        for (const save of saves) {
          save.subscribe({
            next: () => {
              pending--;
              if (pending === 0) {
                this.snackBar.open('Orden registrada correctamente', 'Cerrar', { duration: 3000 });
                this.router.navigate(['/dashboard/ordenes/en-curso']);
              }
            },
            error: (err: unknown) => {
              console.error('Error guardando detalle:', err);
              this.snackBar.open('Error al guardar algunos detalles', 'Cerrar', { duration: 4000 });
            },
          });
        }
      },
      error: (err: unknown) => {
        console.error('Error guardando orden:', err);
        this.snackBar.open('Error al registrar la orden', 'Cerrar', { duration: 4000 });
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/ordenes/en-curso']);
  }
}
