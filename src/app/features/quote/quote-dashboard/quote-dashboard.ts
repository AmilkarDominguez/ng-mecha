import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Quote, QuoteState } from '../../../core/models/quote.model';
import { SPQuote } from '../../../core/services/supabase/sb-quote';
import { SPQuoteConversion } from '../../../core/services/supabase/sb-quote-conversion';
import { QuoteDetailModal } from '../components/quote-detail-modal/quote-detail-modal';

const ACTIVE_STATES: QuoteState[] = ['PENDING', 'APPROVED', 'CONVERTED'];
const VOIDED_STATES: QuoteState[] = ['REJECTED', 'EXPIRED', 'CANCELED'];

@Component({
  selector: 'app-quote-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    DecimalPipe,
    NgTemplateOutlet,
  ],
  templateUrl: './quote-dashboard.html',
  styleUrl: './quote-dashboard.scss',
})
export class QuoteDashboard {
  private quoteProvider = inject(SPQuote);
  private quoteConversion = inject(SPQuoteConversion);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly quotes = toSignal(this.quoteProvider.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  private readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.quotes();
    return this.quotes().filter((q) =>
      (q.number ?? '').toLowerCase().includes(term) ||
      this.customerLabel(q).toLowerCase().includes(term),
    );
  });

  readonly activeQuotes = computed(() => this.filtered().filter((q) => ACTIVE_STATES.includes(q.state)));
  readonly voidedQuotes = computed(() => this.filtered().filter((q) => VOIDED_STATES.includes(q.state)));

  readonly columns = ['number', 'customer', 'vehicle', 'total', 'state', 'expiration_date', 'actions'];

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onNew(): void {
    this.router.navigate(['/dashboard/cotizaciones/nueva']);
  }

  onEdit(quote: Quote): void {
    this.router.navigate(['/dashboard/cotizaciones/editar', quote.id]);
  }

  onView(quote: Quote): void {
    this.dialog.open(QuoteDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: quote,
    });
  }

  onConvert(quote: Quote): void {
    this.router.navigate(['/dashboard/ordenes/nueva'], { queryParams: { quoteId: quote.id } });
  }

  onApprove(quote: Quote): void {
    if (!quote.expiration_date) {
      this.snackBar.open('Defina una fecha de vencimiento antes de aprobar (edite la cotización)', 'Cerrar', { duration: 4000 });
      return;
    }
    this.quoteConversion.approve(quote.id).subscribe({
      next: () => this.snackBar.open('Cotización aprobada — stock reservado', 'Cerrar', { duration: 3000 }),
      error: (err: unknown) => {
        this.snackBar.open((err as Error)?.message ?? 'No se pudo aprobar la cotización', 'Cerrar', { duration: 5000 });
      },
    });
  }

  onReject(quote: Quote): void {
    this.quoteConversion.reject(quote.id).subscribe({
      next: () => this.snackBar.open('Cotización rechazada', 'Cerrar', { duration: 3000 }),
      error: (err: unknown) => {
        this.snackBar.open((err as Error)?.message ?? 'No se pudo rechazar la cotización', 'Cerrar', { duration: 5000 });
      },
    });
  }

  onCancelQuote(quote: Quote): void {
    this.quoteConversion.cancel(quote.id).subscribe({
      next: () => this.snackBar.open('Cotización anulada', 'Cerrar', { duration: 3000 }),
      error: (err: unknown) => {
        this.snackBar.open((err as Error)?.message ?? 'No se pudo anular la cotización', 'Cerrar', { duration: 5000 });
      },
    });
  }

  customerLabel(q: Quote): string {
    const c = q.customer;
    if (!c) return '—';
    return [c.name, c.lastname].filter(Boolean).join(' ') || '—';
  }

  vehicleLabel(q: Quote): string {
    const v = q.vehicle;
    if (!v) return '—';
    return [v.brand, v.model, v.license_plate].filter(Boolean).join(' ') || '—';
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
}
