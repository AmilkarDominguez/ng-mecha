import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogFrame } from '../../../../shared/components/dialog-frame/dialog-frame';
import { BankAccountHistory } from '../../../../core/models/bank-account-history.model';
import { SPBankAccount } from '../../../../core/services/supabase/sb-bank-account';

export interface ServiceOrderPaymentFormData {
  payment?: BankAccountHistory;
  maxAmount: number;
}

export interface ServiceOrderPaymentFormResult {
  bank_account_id: string;
  amount: number;
  concept: string | null;
}

@Component({
  selector: 'app-service-order-payment-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    DecimalPipe,
  ],
  templateUrl: './service-order-payment-form-modal.html',
  styleUrl: './service-order-payment-form-modal.scss',
})
export class ServiceOrderPaymentFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ServiceOrderPaymentFormModal>);
  private bankAccountService = inject(SPBankAccount);
  private data: ServiceOrderPaymentFormData = inject(MAT_DIALOG_DATA);

  readonly bankAccounts = toSignal(this.bankAccountService.listen(), { initialValue: [] });
  readonly activeBankAccounts = () => this.bankAccounts().filter((a) => a.state === 'ACTIVE');

  readonly maxAmount = this.data.maxAmount;

  get isEditMode(): boolean {
    return !!this.data?.payment;
  }

  form = this.fb.group({
    bank_account_id: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(this.maxAmount)]],
    concept: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    if (this.data?.payment) {
      this.form.patchValue({
        bank_account_id: this.data.payment.bank_account_id ?? '',
        amount: this.data.payment.amount,
        concept: this.data.payment.concept ?? '',
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    this.dialogRef.close({
      bank_account_id: raw.bank_account_id!,
      amount: raw.amount!,
      concept: raw.concept || null,
    } satisfies ServiceOrderPaymentFormResult);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return 'El monto debe ser mayor a 0';
    if (control.errors['max']) return `El monto no puede superar el saldo pendiente (Bs. ${this.maxAmount.toFixed(2)})`;
    return 'Campo inválido';
  }
}
