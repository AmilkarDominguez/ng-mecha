import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, concatMap, switchMap } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { TabCustomer, CustomerTabValue } from '../components/tab-customer/tab-customer';
import { TabLabor } from '../components/tab-labor/tab-labor';
import { TabParts } from '../components/tab-parts/tab-parts';
import { TabExternal } from '../components/tab-external/tab-external';
import { TabQuote } from '../components/tab-quote/tab-quote';
import { ServiceOrderServicesTable } from '../components/service-order-services-table/service-order-services-table';
import { ServiceOrderBatchesTable } from '../components/service-order-batches-table/service-order-batches-table';
import { ServiceOrderExternalServicesTable } from '../components/service-order-external-services-table/service-order-external-services-table';
import { ServiceOrderQuotesTable } from '../components/service-order-quotes-table/service-order-quotes-table';
import {
  ServiceOrder,
  ServiceOrderServiceRow,
  ServiceOrderBatchRow,
  ServiceOrderExternalServiceRow,
  ServiceOrderExternalService,
  OrderServiceLine,
  OrderBatchLine,
  OrderExternalLine,
} from '../../../core/models/service-order.model';
import { Quote } from '../../../core/models/quote.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';
import { SPServiceOrderExternalExpense } from '../../../core/services/supabase/sb-service-order-external-expense';
import { SPQuote } from '../../../core/services/supabase/sb-quote';
import { SPQuoteConversion } from '../../../core/services/supabase/sb-quote-conversion';
import { AuthService } from '../../../core/auth/services/auth.service';

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
    MatProgressSpinnerModule,
    DecimalPipe,
    TabCustomer,
    TabLabor,
    TabParts,
    TabExternal,
    TabQuote,
    ServiceOrderServicesTable,
    ServiceOrderBatchesTable,
    ServiceOrderExternalServicesTable,
    ServiceOrderQuotesTable,
  ],
  templateUrl: './service-order-form.html',
  styleUrl: './service-order-form.scss',
})
export class ServiceOrderForm implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private externalExpenseService = inject(SPServiceOrderExternalExpense);
  private quoteProvider = inject(SPQuote);
  private quoteConversion = inject(SPQuoteConversion);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  readonly isEditMode     = signal(false);
  readonly editOrderId    = signal<string | null>(null);
  readonly loading        = signal(false);
  readonly originalUserId = signal<string | null>(null);

  readonly customerTabValue = signal<CustomerTabValue | null>(null);

  readonly serviceRows  = signal<ServiceOrderServiceRow[]>([]);
  readonly batchRows    = signal<ServiceOrderBatchRow[]>([]);
  readonly externalRows = signal<ServiceOrderExternalServiceRow[]>([]);
  readonly selectedQuotes = signal<Quote[]>([]);

  readonly selectedQuoteIds = computed(() => this.selectedQuotes().map((q) => q.id));

  readonly summaryForm = new FormGroup({
    number:       new FormControl<string>(''),
    payment_type: new FormControl<'CASH' | 'CREDIT'>('CASH'),
    with_iva:     new FormControl<boolean>(false),
    description:  new FormControl<string>(''),
    return_date:  new FormControl<Date | null>(null),
  });

  readonly subtotalServices = computed(() =>
    this.serviceRows().reduce((acc, r) => {
      const base     = (r.price ?? 0) * (r.quantity ?? 1);
      const discount = base * ((r.discount ?? 0) / 100);
      return acc + base - discount;
    }, 0),
  );

  readonly subtotalBatches = computed(() =>
    this.batchRows().reduce((acc, r) => {
      const base     = (r.price ?? 0) * (r.quantity ?? 1);
      const discount = base * ((r.discount ?? 0) / 100);
      return acc + base - discount;
    }, 0),
  );

  readonly subtotalExternal = computed(() =>
    this.externalRows().reduce((acc, r) => acc + (r.price ?? 0) * (r.quantity ?? 1), 0),
  );

  // Informativo: no se suma a total()/payload.total. El total real de la
  // orden lo recalcula convert_quote_to_order() desde cero (todas las
  // lineas de la orden) al procesar cada cotizacion en finalizeWithQuotes().
  readonly subtotalQuotes = computed(() =>
    this.selectedQuotes().reduce((acc, q) => acc + (q.total ?? 0), 0),
  );

  readonly total = computed(
    () => this.subtotalServices() + this.subtotalBatches() + this.subtotalExternal(),
  );

  readonly ivaAmount = computed(() => {
    const withIva = this.summaryForm.value.with_iva;
    return withIva ? this.total() * IVA_RATE : 0;
  });

  readonly totalWithIva = computed(() => this.total() + this.ivaAmount());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      const quoteId = this.route.snapshot.queryParamMap.get('quoteId');
      if (quoteId) {
        this.quoteProvider.getById(quoteId).subscribe({
          next: (quote) => {
            this.selectedQuotes.set([quote]);
            this.customerTabValue.set({
              customer_id:  quote.customer_id,
              vehicle_id:   quote.vehicle_id,
              mechanic_id:  null,
              mileage:      null,
              started_date: null,
              ended_date:   null,
            });
          },
          error: () => {
            this.snackBar.open('No se pudo cargar la cotización seleccionada', 'Cerrar', { duration: 4000 });
          },
        });
      }
    }
    if (id) {
      this.isEditMode.set(true);
      this.editOrderId.set(id);
      this.loading.set(true);
      this.serviceOrderProvider.getWithLines(id).subscribe({
        next: (order) => {
          this.originalUserId.set(order.user_id);
          this.summaryForm.patchValue({
            number:       order.number ?? '',
            payment_type: order.payment_type,
            with_iva:     order.with_iva,
            description:  order.description ?? '',
            return_date:  order.return_date ? new Date(order.return_date) : null,
          });
          this.customerTabValue.set({
            customer_id:  order.customer_id,
            vehicle_id:   order.vehicle_id,
            mechanic_id:  order.mechanic_id,
            mileage:      order.mileage,
            started_date: order.started_date,
            ended_date:   order.ended_date,
          });
          this.serviceRows.set(order.order_services.map((l) => this.toServiceRow(l)));
          this.batchRows.set(order.order_batches.map((l) => this.toBatchRow(l)));
          this.externalRows.set(order.order_externals.map((l) => this.toExternalRow(l)));
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Error al cargar la orden', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard/ordenes/en-curso']);
        },
      });
    }
  }

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

  onAddQuote(quote: Quote): void {
    this.selectedQuotes.update((quotes) =>
      quotes.some((q) => q.id === quote.id) ? quotes : [...quotes, quote],
    );
  }

  onRemoveQuote(id: string): void {
    this.selectedQuotes.update((quotes) => quotes.filter((q) => q.id !== id));
  }

  onSave(): void {
    const tab = this.customerTabValue();
    if (!tab?.customer_id) {
      this.snackBar.open('Debe seleccionar un cliente', 'Cerrar', { duration: 3000 });
      return;
    }

    const raw     = this.summaryForm.value;
    const withIva = raw.with_iva ?? false;

    const payload = {
      customer_id:           tab.customer_id,
      vehicle_id:            tab.vehicle_id,
      mechanic_id:           tab.mechanic_id,
      user_id:               this.isEditMode() ? this.originalUserId() : (this.auth.currentUser()?.id ?? null),
      number:                raw.number || null,
      description:           raw.description || null,
      total:                 this.total(),
      have:                  0,
      must:                  this.totalWithIva(),
      iva:                   withIva ? this.ivaAmount() : null,
      total_iva:             withIva ? this.totalWithIva() : null,
      with_iva:              withIva,
      mileage:               tab.mileage,
      draft_expiration_date: null,
      started_date:          tab.started_date,
      ended_date:            tab.ended_date,
      return_date:           raw.return_date ? raw.return_date.toISOString().split('T')[0] : null,
      state:                 'IN_PROGRESS' as const,
      payment_type:          raw.payment_type ?? 'CASH',
    };

    if (this.isEditMode() && this.editOrderId()) {
      this.executeUpdate(this.editOrderId()!, payload);
    } else {
      this.executeCreate(payload);
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/ordenes/en-curso']);
  }

  private executeCreate(payload: Omit<ServiceOrder, 'id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle'>): void {
    this.serviceOrderProvider.add(payload).subscribe({
      next: (order) => {
        const orderId = order.id;
        this.saveLines(orderId, 'Orden registrada correctamente');
      },
      error: (err: unknown) => {
        console.error('Error guardando orden:', err);
        this.snackBar.open('Error al registrar la orden', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private executeUpdate(orderId: string, payload: object): void {
    this.serviceOrderProvider.update({ id: orderId, ...payload } as ServiceOrder).subscribe({
      next: () => {
        this.externalExpenseService.reverseForOrder(orderId).subscribe({
          next: () => {
            this.serviceOrderProvider.deleteLinesByOrderId(orderId).subscribe({
              next: () => this.saveLines(orderId, 'Orden actualizada correctamente'),
              error: () => {
                this.snackBar.open('Error al sincronizar las líneas', 'Cerrar', { duration: 4000 });
              },
            });
          },
          error: (err: unknown) => {
            this.snackBar.open(
              (err as Error)?.message ?? 'No se pudieron revertir los egresos de servicios externos; no se actualizó la orden.',
              'Cerrar',
              { duration: 5000 },
            );
          },
        });
      },
      error: () => {
        this.snackBar.open('Error al actualizar la orden', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private saveLines(orderId: string, successMessage: string): void {
    const servicesToSave = this.serviceRows().map((r) => ({
      service_id:       r.service_id,
      service_order_id: orderId,
      quote_id:         r.quote_id,
      price:            r.price,
      quantity:         r.quantity,
      discount:         r.discount,
      subtotal:         r.subtotal,
    }));

    const batchesToSave = this.batchRows().map((r) => ({
      batch_id:         r.batch_id,
      service_order_id: orderId,
      quote_id:         r.quote_id,
      quantity:         r.quantity,
      delivery_time:    r.delivery_time,
      price:            r.price,
      discount:         r.discount,
      subtotal:         r.subtotal,
    }));

    const externalToSave = this.externalRows().map((r) => ({
      external_service_id: r.external_service_id,
      service_order_id:    orderId,
      bank_account_id:     r.bank_account_id,
      quote_id:            r.quote_id,
      cost:                r.cost,
      price:               r.price,
      quantity:            r.quantity,
      subtotal:            r.subtotal,
    }));

    const saves: Observable<unknown>[] = [];
    if (servicesToSave.length > 0)  saves.push(this.serviceOrderProvider.bulkAddServices(servicesToSave) as Observable<unknown>);
    if (batchesToSave.length > 0)   saves.push(this.serviceOrderProvider.bulkAddBatches(batchesToSave) as Observable<unknown>);
    if (externalToSave.length > 0) {
      saves.push(
        this.serviceOrderProvider.bulkAddExternalServices(externalToSave).pipe(
          switchMap((created) => this.applyExternalExpenses(created)),
        ) as Observable<unknown>,
      );
    }

    if (saves.length === 0) {
      this.finalizeWithQuotes(orderId, successMessage);
      return;
    }

    let pending = saves.length;
    for (const save of saves) {
      save.subscribe({
        next: () => {
          pending--;
          if (pending === 0) {
            this.finalizeWithQuotes(orderId, successMessage);
          }
        },
        error: (err: unknown) => {
          console.error('Error guardando detalle:', err);
          this.snackBar.open('Error al guardar algunos detalles', 'Cerrar', { duration: 4000 });
        },
      });
    }
  }

  /**
   * Convierte secuencialmente (concatMap, no forkJoin) cada cotizacion
   * APPROVED seleccionada hacia esta orden — ver quote-module.md #4.3. Se
   * llama DESPUES de guardar las lineas ad-hoc, porque cada conversion
   * recalcula el total de la orden sumando TODAS sus lineas existentes.
   * Si una conversion falla, las anteriores ya aplicadas quedan intactas
   * (el error se atribuye a esa cotizacion puntual, sin bloquear al resto).
   */
  private finalizeWithQuotes(orderId: string, successMessage: string): void {
    const quoteIds = this.selectedQuoteIds();
    if (quoteIds.length === 0) {
      this.snackBar.open(successMessage, 'Cerrar', { duration: 3000 });
      this.router.navigate(['/dashboard/ordenes/en-curso']);
      return;
    }

    from(quoteIds).pipe(
      concatMap((quoteId) =>
        this.quoteConversion.convertToOrder(quoteId, orderId).pipe(
          catchError((err: unknown) => {
            this.snackBar.open(
              (err as Error)?.message ?? 'No se pudo convertir una de las cotizaciones seleccionadas',
              'Cerrar',
              { duration: 5000 },
            );
            return of(null);
          }),
        ),
      ),
    ).subscribe({
      complete: () => {
        this.snackBar.open(successMessage, 'Cerrar', { duration: 3000 });
        this.router.navigate(['/dashboard/ordenes/en-curso']);
      },
    });
  }

  private applyExternalExpenses(rows: ServiceOrderExternalService[]): Observable<unknown> {
    const withAccount = rows.filter((r) => r.bank_account_id);
    if (withAccount.length === 0) return of(null);

    const originalRows = this.externalRows();
    const applies = withAccount.map((r) => {
      const original = originalRows.find(
        (o) => o.external_service_id === r.external_service_id && o.bank_account_id === r.bank_account_id,
      );
      const concept = 'Servicio externo' + (original?.external_service_name ? ' — ' + original.external_service_name : '');
      return this.externalExpenseService
        .apply({
          lineId: r.id,
          bankAccountId: r.bank_account_id!,
          cost: r.cost,
          quantity: r.quantity,
          concept,
          userId: this.auth.currentUser()?.id ?? null,
        })
        .pipe(
          catchError((err: unknown) => {
            this.snackBar.open(
              (err as Error)?.message ?? 'No se pudo registrar el egreso de un servicio externo',
              'Cerrar',
              { duration: 5000 },
            );
            return of(null);
          }),
        );
    });
    return forkJoin(applies);
  }

  private toServiceRow(l: OrderServiceLine): ServiceOrderServiceRow {
    return {
      id:               l.id,
      service_id:       l.service_id,
      service_order_id: null,
      quote_id:         l.quote_id,
      price:            l.price,
      quantity:         l.quantity,
      discount:         l.discount,
      subtotal:         l.subtotal,
      service_name:     l.service?.name ?? '',
    };
  }

  private toBatchRow(l: OrderBatchLine): ServiceOrderBatchRow {
    return {
      id:               l.id,
      batch_id:         l.batch_id,
      service_order_id: null,
      quote_id:         l.quote_id,
      quantity:         l.quantity,
      delivery_time:    l.delivery_time,
      price:            l.price,
      discount:         l.discount,
      subtotal:         l.subtotal,
      product_name:     l.batch?.product?.name ?? '',
      industry_name:    l.batch?.industry?.name ?? '',
    };
  }

  private toExternalRow(l: OrderExternalLine): ServiceOrderExternalServiceRow {
    return {
      id:                    l.id,
      external_service_id:   l.external_service_id,
      service_order_id:      null,
      bank_account_id:       l.bank_account_id,
      quote_id:              l.quote_id,
      cost:                  l.cost,
      price:                 l.price,
      quantity:              l.quantity,
      subtotal:              l.subtotal,
      external_service_name: l.external_service?.name ?? '',
    };
  }
}
