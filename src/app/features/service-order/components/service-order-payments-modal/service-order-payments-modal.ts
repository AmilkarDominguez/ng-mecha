import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogFrame } from '../../../../shared/components/dialog-frame/dialog-frame';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { BankAccountHistory } from '../../../../core/models/bank-account-history.model';
import { ServiceOrder } from '../../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../../core/services/supabase/sb-service-order';
import { SPServiceOrderPayment } from '../../../../core/services/supabase/sb-service-order-payment';
import {
  ServiceOrderPaymentFormModal,
  ServiceOrderPaymentFormData,
  ServiceOrderPaymentFormResult,
} from '../service-order-payment-form-modal/service-order-payment-form-modal';
import { ServiceOrderPaymentDeleteConfirmModal } from '../service-order-payment-delete-confirm-modal/service-order-payment-delete-confirm-modal';

@Component({
  selector: 'app-service-order-payments-modal',
  imports: [
    DialogFrame,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './service-order-payments-modal.html',
  styleUrl: './service-order-payments-modal.scss',
})
export class ServiceOrderPaymentsModal implements OnInit {
  private dialogRef = inject(MatDialogRef<ServiceOrderPaymentsModal>);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private orderService = inject(SPServiceOrder);
  private paymentService = inject(SPServiceOrderPayment);
  private auth = inject(AuthService);
  private data: { order: ServiceOrder } = inject(MAT_DIALOG_DATA);

  readonly order = signal<ServiceOrder>(this.data.order);
  readonly payments = signal<BankAccountHistory[]>([]);
  readonly loading = signal(false);

  readonly columns = ['created_at', 'bank_account', 'amount', 'concept', 'actions'];

  readonly totalDue = computed(() => {
    const o = this.order();
    return (o.with_iva ? o.total_iva ?? o.total : o.total) ?? 0;
  });

  readonly must = computed(() => this.order().must ?? 0);
  readonly have = computed(() => this.order().have ?? 0);
  readonly fullyPaid = computed(() => this.must() <= 0.009);
  readonly canRegister = computed(() => !this.fullyPaid() && this.order().state !== 'CANCELED');

  ngOnInit(): void {
    this.loadPayments();
  }

  private loadPayments(): void {
    this.loading.set(true);
    this.paymentService.list(this.order().id).subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private refreshOrder(): void {
    this.orderService.getById(this.order().id).subscribe((order) => this.order.set(order));
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onRegister(): void {
    const ref = this.dialog.open(ServiceOrderPaymentFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { maxAmount: this.must() } satisfies ServiceOrderPaymentFormData,
    });

    ref.afterClosed().subscribe((result: ServiceOrderPaymentFormResult | null) => {
      if (!result) return;

      this.paymentService
        .register({
          serviceOrderId: this.order().id,
          bankAccountId: result.bank_account_id,
          amount: result.amount,
          concept: result.concept,
          userId: this.auth.currentUser()?.id ?? null,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Pago registrado correctamente', 'Cerrar', { duration: 3000 });
            this.loadPayments();
            this.refreshOrder();
          },
          error: (err) => {
            this.snackBar.open(err?.message ?? 'No se pudo registrar el pago', 'Cerrar', { duration: 4000 });
          },
        });
    });
  }

  onEdit(payment: BankAccountHistory): void {
    const maxAmount = this.must() + (payment.amount ?? 0);
    const ref = this.dialog.open(ServiceOrderPaymentFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { payment, maxAmount } satisfies ServiceOrderPaymentFormData,
    });

    ref.afterClosed().subscribe((result: ServiceOrderPaymentFormResult | null) => {
      if (!result) return;

      this.paymentService
        .edit(payment, {
          bankAccountId: result.bank_account_id,
          amount: result.amount,
          concept: result.concept,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Pago actualizado correctamente', 'Cerrar', { duration: 3000 });
            this.loadPayments();
            this.refreshOrder();
          },
          error: (err) => {
            this.snackBar.open(err?.message ?? 'No se pudo actualizar el pago', 'Cerrar', { duration: 4000 });
          },
        });
    });
  }

  onDelete(payment: BankAccountHistory): void {
    const ref = this.dialog.open(ServiceOrderPaymentDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: payment,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.paymentService.remove(payment).subscribe({
        next: () => {
          this.snackBar.open('Pago eliminado', 'Cerrar', { duration: 3000 });
          this.loadPayments();
          this.refreshOrder();
        },
        error: (err) => {
          this.snackBar.open(err?.message ?? 'No se pudo eliminar el pago', 'Cerrar', { duration: 4000 });
        },
      });
    });
  }
}
