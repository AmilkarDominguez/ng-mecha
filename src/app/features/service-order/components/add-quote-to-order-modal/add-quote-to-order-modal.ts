import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceOrder } from '../../../../core/models/service-order.model';
import { Quote } from '../../../../core/models/quote.model';
import { SPQuote } from '../../../../core/services/supabase/sb-quote';
import { SPQuoteConversion } from '../../../../core/services/supabase/sb-quote-conversion';
import { DialogFrame } from '../../../../shared/components/dialog-frame/dialog-frame';

export interface AddQuoteToOrderModalData {
  order: ServiceOrder;
}

@Component({
  selector: 'app-add-quote-to-order-modal',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DialogFrame,
  ],
  templateUrl: './add-quote-to-order-modal.html',
  styleUrl: './add-quote-to-order-modal.scss',
})
export class AddQuoteToOrderModal {
  private dialogRef = inject(MatDialogRef<AddQuoteToOrderModal>);
  private quoteService = inject(SPQuote);
  private quoteConversion = inject(SPQuoteConversion);
  private snackBar = inject(MatSnackBar);
  readonly data: AddQuoteToOrderModalData = inject(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly quoteCtrl = new FormControl<Quote | string | null>(null);

  private readonly allQuotes = toSignal(this.quoteService.get(), { initialValue: [] });
  private readonly quoteCtrlValue = toSignal(this.quoteCtrl.valueChanges, { initialValue: null });

  readonly selectedQuote = signal<Quote | null>(null);

  readonly eligibleQuotes = computed(() =>
    this.allQuotes().filter(
      (q) => q.state === 'APPROVED' && q.customer_id === this.data.order.customer_id,
    ),
  );

  readonly filteredQuotes = computed(() => {
    const val = this.quoteCtrlValue();
    const all = this.eligibleQuotes();
    if (!val || typeof val !== 'string') return all;
    const term = val.toLowerCase().trim();
    return all.filter((q) => this.quoteLabel(q).toLowerCase().includes(term));
  });

  displayQuote = (value: Quote | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.quoteLabel(value);
  };

  quoteLabel(q: Quote): string {
    const total = q.total != null ? `Bs. ${q.total.toFixed(2)}` : '';
    return [q.number ?? q.id.slice(0, 8), total].filter(Boolean).join(' — ');
  }

  onQuoteSelected(quote: Quote): void {
    this.selectedQuote.set(quote);
  }

  onConfirm(): void {
    const quote = this.selectedQuote();
    if (!quote) {
      this.snackBar.open('Seleccione una cotización aprobada', 'Cerrar', { duration: 2500 });
      return;
    }

    this.saving.set(true);
    this.quoteConversion.convertToOrder(quote.id, this.data.order.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Cotización agregada a la orden', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.snackBar.open(
          (err as Error)?.message ?? 'No se pudo agregar la cotización a la orden',
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
