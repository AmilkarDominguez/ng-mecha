import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
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
import { QuoteTabCustomer, QuoteCustomerTabValue } from '../components/tab-customer/tab-customer';
import { QuoteTabLabor } from '../components/tab-labor/tab-labor';
import { QuoteTabParts } from '../components/tab-parts/tab-parts';
import { QuoteTabExternal } from '../components/tab-external/tab-external';
import { QuoteServicesTable } from '../components/quote-services-table/quote-services-table';
import { QuoteBatchesTable } from '../components/quote-batches-table/quote-batches-table';
import { QuoteExternalServicesTable } from '../components/quote-external-services-table/quote-external-services-table';
import {
  Quote,
  QuoteServiceRow,
  QuoteBatchRow,
  QuoteExternalServiceRow,
  QuoteServiceLine,
  QuoteBatchLine,
  QuoteExternalLine,
} from '../../../core/models/quote.model';
import { SPQuote } from '../../../core/services/supabase/sb-quote';
import { AuthService } from '../../../core/auth/services/auth.service';

const IVA_RATE = 0.13;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

@Component({
  selector: 'app-quote-form',
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
    QuoteTabCustomer,
    QuoteTabLabor,
    QuoteTabParts,
    QuoteTabExternal,
    QuoteServicesTable,
    QuoteBatchesTable,
    QuoteExternalServicesTable,
  ],
  templateUrl: './quote-form.html',
  styleUrl: './quote-form.scss',
})
export class QuoteForm implements OnInit {
  private quoteProvider = inject(SPQuote);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  readonly isEditMode  = signal(false);
  readonly editQuoteId = signal<string | null>(null);
  readonly loading     = signal(false);

  readonly customerTabValue = signal<QuoteCustomerTabValue | null>(null);

  readonly serviceRows  = signal<QuoteServiceRow[]>([]);
  readonly batchRows    = signal<QuoteBatchRow[]>([]);
  readonly externalRows = signal<QuoteExternalServiceRow[]>([]);

  readonly summaryForm = new FormGroup({
    number:          new FormControl<string>(''),
    with_iva:        new FormControl<boolean>(false),
    description:     new FormControl<string>(''),
    expiration_date: new FormControl<Date | null>(addDays(new Date(), 3)),
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
    if (id) {
      this.isEditMode.set(true);
      this.editQuoteId.set(id);
      this.loading.set(true);
      this.quoteProvider.getWithLines(id).subscribe({
        next: (quote) => {
          this.summaryForm.patchValue({
            number:          quote.number ?? '',
            with_iva:        quote.with_iva,
            description:     quote.description ?? '',
            expiration_date: quote.expiration_date ? new Date(quote.expiration_date) : null,
          });
          this.customerTabValue.set({
            customer_id: quote.customer_id,
            vehicle_id:  quote.vehicle_id,
          });
          this.serviceRows.set(quote.lines_services.map((l) => this.toServiceRow(l)));
          this.batchRows.set(quote.lines_batches.map((l) => this.toBatchRow(l)));
          this.externalRows.set(quote.lines_externals.map((l) => this.toExternalRow(l)));
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Error al cargar la cotización', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard/cotizaciones/activas']);
        },
      });
    }
  }

  onCustomerTabChange(value: QuoteCustomerTabValue): void {
    this.customerTabValue.set(value);
  }

  onAddService(row: QuoteServiceRow): void {
    this.serviceRows.update((rows) => [...rows, row]);
  }

  onRemoveService(id: string): void {
    this.serviceRows.update((rows) => rows.filter((r) => r.id !== id));
  }

  onAddBatch(row: QuoteBatchRow): void {
    this.batchRows.update((rows) => [...rows, row]);
  }

  onRemoveBatch(id: string): void {
    this.batchRows.update((rows) => rows.filter((r) => r.id !== id));
  }

  onAddExternal(row: QuoteExternalServiceRow): void {
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

    const raw     = this.summaryForm.value;
    const withIva = raw.with_iva ?? false;

    const payload = {
      customer_id:                 tab.customer_id,
      vehicle_id:                  tab.vehicle_id,
      user_id:                     this.auth.currentUser()?.id ?? null,
      converted_service_order_id:  null,
      number:                      raw.number || null,
      description:                 raw.description || null,
      total:                       this.total(),
      iva:                         withIva ? this.ivaAmount() : null,
      total_iva:                   withIva ? this.totalWithIva() : null,
      with_iva:                    withIva,
      expiration_date:             raw.expiration_date ? this.toIsoDate(raw.expiration_date) : null,
      state:                       'PENDING' as const,
    };

    if (this.isEditMode() && this.editQuoteId()) {
      this.executeUpdate(this.editQuoteId()!, payload);
    } else {
      this.executeCreate(payload);
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/cotizaciones/activas']);
  }

  private executeCreate(payload: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle'>): void {
    this.quoteProvider.add(payload).subscribe({
      next: (quote) => {
        this.saveLines(quote.id, 'Cotización registrada correctamente');
      },
      error: (err: unknown) => {
        console.error('Error guardando cotización:', err);
        this.snackBar.open('Error al registrar la cotización', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private executeUpdate(quoteId: string, payload: object): void {
    this.quoteProvider.update({ id: quoteId, ...payload } as Quote).subscribe({
      next: () => {
        this.quoteProvider.deleteLinesByQuoteId(quoteId).subscribe({
          next: () => this.saveLines(quoteId, 'Cotización actualizada correctamente'),
          error: () => {
            this.snackBar.open('Error al sincronizar las líneas', 'Cerrar', { duration: 4000 });
          },
        });
      },
      error: () => {
        this.snackBar.open('Error al actualizar la cotización', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private saveLines(quoteId: string, successMessage: string): void {
    const servicesToSave = this.serviceRows().map((r) => ({
      service_id: r.service_id,
      quote_id:   quoteId,
      price:      r.price,
      quantity:   r.quantity,
      discount:   r.discount,
      subtotal:   r.subtotal,
    }));

    const batchesToSave = this.batchRows().map((r) => ({
      batch_id:      r.batch_id,
      quote_id:      quoteId,
      description:   r.description,
      quantity:      r.quantity,
      delivery_time: r.delivery_time,
      price:         r.price,
      discount:      r.discount,
      subtotal:      r.subtotal,
    }));

    const externalToSave = this.externalRows().map((r) => ({
      external_service_id: r.external_service_id,
      quote_id:             quoteId,
      cost:                 r.cost,
      price:                r.price,
      quantity:             r.quantity,
      subtotal:             r.subtotal,
    }));

    const saves: Observable<unknown>[] = [];
    if (servicesToSave.length > 0)  saves.push(this.quoteProvider.bulkAddServices(servicesToSave) as Observable<unknown>);
    if (batchesToSave.length > 0)   saves.push(this.quoteProvider.bulkAddBatches(batchesToSave) as Observable<unknown>);
    if (externalToSave.length > 0)  saves.push(this.quoteProvider.bulkAddExternalServices(externalToSave) as Observable<unknown>);

    if (saves.length === 0) {
      this.snackBar.open(successMessage, 'Cerrar', { duration: 3000 });
      this.router.navigate(['/dashboard/cotizaciones/activas']);
      return;
    }

    let pending = saves.length;
    for (const save of saves) {
      save.subscribe({
        next: () => {
          pending--;
          if (pending === 0) {
            this.snackBar.open(successMessage, 'Cerrar', { duration: 3000 });
            this.router.navigate(['/dashboard/cotizaciones/activas']);
          }
        },
        error: (err: unknown) => {
          console.error('Error guardando detalle:', err);
          this.snackBar.open('Error al guardar algunos detalles', 'Cerrar', { duration: 4000 });
        },
      });
    }
  }

  private toServiceRow(l: QuoteServiceLine): QuoteServiceRow {
    return {
      id:           l.id,
      service_id:   l.service_id,
      quote_id:     null,
      price:        l.price,
      quantity:     l.quantity,
      discount:     l.discount,
      subtotal:     l.subtotal,
      service_name: l.service?.name ?? '',
    };
  }

  private toBatchRow(l: QuoteBatchLine): QuoteBatchRow {
    return {
      id:            l.id,
      batch_id:      l.batch_id,
      quote_id:      null,
      description:   l.description,
      quantity:      l.quantity,
      delivery_time: l.delivery_time,
      price:         l.price,
      discount:      l.discount,
      subtotal:      l.subtotal,
      product_name:  l.batch?.product?.name ?? l.batch?.description ?? l.description ?? '',
      industry_name: l.batch?.industry?.name ?? (l.batch_id ? '—' : 'Por pedir'),
    };
  }

  private toExternalRow(l: QuoteExternalLine): QuoteExternalServiceRow {
    return {
      id:                    l.id,
      external_service_id:   l.external_service_id,
      quote_id:              null,
      cost:                  l.cost,
      price:                 l.price,
      quantity:              l.quantity,
      subtotal:              l.subtotal,
      external_service_name: l.external_service?.name ?? '',
    };
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
