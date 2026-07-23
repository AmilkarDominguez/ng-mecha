import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Quote,
  QuoteBatchLine,
  QuoteExternalLine,
  QuoteServiceLine,
  QuoteWithLines,
} from '../../../../core/models/quote.model';
import { SPQuote } from '../../../../core/services/supabase/sb-quote';
import { WorkshopSettings } from '../../../../core/models/workshop-settings.model';
import { SPWorkshopSettings } from '../../../../core/services/supabase/sb-workshop-settings';

const DEFAULT_VALIDEZ_DIAS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-quote-print-modal',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  templateUrl: './quote-print-modal.html',
  styleUrl: './quote-print-modal.scss',
})
export class QuotePrintModal implements OnInit {
  private quoteService = inject(SPQuote);
  private settingsService = inject(SPWorkshopSettings);
  private dialogRef = inject(MatDialogRef<QuotePrintModal>);
  readonly data = inject<Quote>(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly detail = signal<QuoteWithLines | null>(null);
  readonly settings = signal<WorkshopSettings | null>(null);

  // Dias de validez = diferencia real entre created_at y expiration_date de
  // la cotizacion (por defecto 3, igual que el valor inicial de quote-form.ts).
  readonly validezDias = computed(() => {
    const d = this.detail();
    if (!d?.created_at || !d?.expiration_date) return DEFAULT_VALIDEZ_DIAS;
    const created = new Date(d.created_at);
    const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const expiration = new Date(d.expiration_date + 'T00:00:00');
    const days = Math.round((expiration.getTime() - createdDay.getTime()) / MS_PER_DAY);
    return days > 0 ? days : DEFAULT_VALIDEZ_DIAS;
  });

  ngOnInit(): void {
    this.quoteService.getWithLines(this.data.id).subscribe({
      next: (quote) => {
        this.detail.set(quote);
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
    const c = this.detail()?.customer;
    if (!c) return '—';
    return [c.name, c.lastname].filter(Boolean).join(' ') || '—';
  }

  vehicleDesc(): string {
    const v = this.detail()?.vehicle;
    if (!v) return '—';
    return [v.brand, v.model].filter(Boolean).join('/ ') || '—';
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

  onPrint(): void {
    window.print();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
