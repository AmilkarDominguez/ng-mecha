import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Quote,
  QuoteBatchLine,
  QuoteExternalLine,
  QuoteServiceLine,
  QuoteState,
  QuoteWithLines,
} from '../../../../core/models/quote.model';
import { SPQuote } from '../../../../core/services/supabase/sb-quote';
import { DialogFrame } from '../../../../shared/components/dialog-frame/dialog-frame';

@Component({
  selector: 'app-quote-detail-modal',
  imports: [
    DatePipe,
    DecimalPipe,
    DialogFrame,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './quote-detail-modal.html',
  styleUrl: './quote-detail-modal.scss',
})
export class QuoteDetailModal implements OnInit {
  private dialogRef = inject(MatDialogRef<QuoteDetailModal>);
  private quoteService = inject(SPQuote);
  readonly quote: Quote = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly detail = signal<QuoteWithLines | null>(null);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.quoteService.getWithLines(this.quote.id).subscribe({
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

  stateLabel(state: QuoteState): string {
    const map: Record<QuoteState, string> = {
      PENDING:   'Pendiente',
      APPROVED:  'Aprobada',
      REJECTED:  'Rechazada',
      EXPIRED:   'Expirada',
      CONVERTED: 'Convertida',
      CANCELED:  'Anulada',
    };
    return map[state];
  }

  customerLabel(d: QuoteWithLines): string {
    const c = d.customer;
    if (!c) return '—';
    return [c.name, c.lastname].filter(Boolean).join(' ') || '—';
  }

  vehicleLabel(d: QuoteWithLines): string {
    const v = d.vehicle;
    if (!v) return '—';
    return [v.brand, v.model, v.license_plate].filter(Boolean).join(' ') || '—';
  }

  userLabel(d: QuoteWithLines): string {
    const u = d.user;
    if (!u) return 'Sistema';
    return [u.name, u.lastname].filter(Boolean).join(' ') || '—';
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

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
