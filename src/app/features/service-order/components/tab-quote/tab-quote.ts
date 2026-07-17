import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Quote,
  QuoteBatchLine,
  QuoteExternalLine,
  QuoteServiceLine,
  QuoteWithLines,
} from '../../../../core/models/quote.model';
import { SPQuote } from '../../../../core/services/supabase/sb-quote';

@Component({
  selector: 'app-tab-quote',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DecimalPipe,
  ],
  templateUrl: './tab-quote.html',
  styleUrl: './tab-quote.scss',
})
export class TabQuote {
  private quoteService = inject(SPQuote);

  customerId = input<string | null>(null);
  vehicleId = input<string | null>(null);
  excludeIds = input<string[]>([]);

  addQuote = output<Quote>();

  readonly allQuotes = toSignal(this.quoteService.get(), { initialValue: [] });

  readonly quoteCtrl = new FormControl<Quote | string | null>(null);
  private readonly quoteCtrlValue = toSignal(this.quoteCtrl.valueChanges, { initialValue: null });

  readonly eligibleQuotes = computed(() => {
    const customerId = this.customerId();
    const vehicleId = this.vehicleId();
    const exclude = new Set(this.excludeIds());
    return this.allQuotes().filter(
      (q) =>
        q.state === 'APPROVED' &&
        !exclude.has(q.id) &&
        (!customerId || q.customer_id === customerId) &&
        (!vehicleId || q.vehicle_id === vehicleId),
    );
  });

  readonly filteredQuotes = computed(() => {
    const val = this.quoteCtrlValue();
    const all = this.eligibleQuotes();
    if (!val || typeof val !== 'string') return all;
    const term = val.toLowerCase().trim();
    return all.filter((q) => this.quoteLabel(q).toLowerCase().includes(term));
  });

  readonly selectedQuote = signal<Quote | null>(null);
  readonly preview = signal<QuoteWithLines | null>(null);
  readonly loadingPreview = signal(false);
  readonly previewError = signal(false);

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
    this.preview.set(null);
    this.previewError.set(false);
    this.loadingPreview.set(true);

    this.quoteService.getWithLines(quote.id).subscribe({
      next: (data) => {
        this.preview.set(data);
        this.loadingPreview.set(false);
      },
      error: () => {
        this.previewError.set(true);
        this.loadingPreview.set(false);
      },
    });
  }

  onCancelPreview(): void {
    this.selectedQuote.set(null);
    this.preview.set(null);
    this.previewError.set(false);
    this.quoteCtrl.setValue(null);
  }

  onConfirmAdd(): void {
    const quote = this.selectedQuote();
    if (!quote) return;
    this.addQuote.emit(quote);
    this.onCancelPreview();
  }

  serviceName(line: QuoteServiceLine): string {
    return line.service?.name ?? '—';
  }

  batchName(line: QuoteBatchLine): string {
    return line.batch?.product?.name ?? line.batch?.description ?? line.description ?? '—';
  }

  externalServiceName(line: QuoteExternalLine): string {
    return line.external_service?.name ?? '—';
  }
}
