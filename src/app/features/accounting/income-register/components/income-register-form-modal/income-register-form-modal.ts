import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';
import { BankAccountHistory } from '../../../../../core/models/bank-account-history.model';
import { SPBankAccount } from '../../../../../core/services/supabase/sb-bank-account';
import { SPBankIncome } from '../../../../../core/services/supabase/sb-bank-income';

export interface IncomeRegisterFormData {
  history?: BankAccountHistory;
}

export interface IncomeRegisterFormResult {
  bank_account_id: string;
  transaction_type_id: string;
  amount: number;
  concept: string | null;
}

@Component({
  selector: 'app-income-register-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './income-register-form-modal.html',
  styleUrl: './income-register-form-modal.scss',
})
export class IncomeRegisterFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<IncomeRegisterFormModal>);
  private bankAccountService = inject(SPBankAccount);
  private incomeService = inject(SPBankIncome);
  private data: IncomeRegisterFormData = inject(MAT_DIALOG_DATA);

  readonly bankAccounts = toSignal(this.bankAccountService.listen(), { initialValue: [] });
  readonly activeBankAccounts = () => this.bankAccounts().filter((a) => a.state === 'ACTIVE');

  readonly transactionTypes = toSignal(this.incomeService.incomeTransactionTypes(), { initialValue: [] });

  get isEditMode(): boolean {
    return !!this.data?.history;
  }

  form = this.fb.group({
    bank_account_id: ['', [Validators.required]],
    transaction_type_id: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    concept: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    if (this.data?.history) {
      this.form.patchValue({
        bank_account_id: this.data.history.bank_account_id ?? '',
        transaction_type_id: this.data.history.transaction_type_id ?? '',
        amount: this.data.history.amount,
        concept: this.data.history.concept ?? '',
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
      transaction_type_id: raw.transaction_type_id!,
      amount: raw.amount!,
      concept: raw.concept || null,
    } satisfies IncomeRegisterFormResult);
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
    return 'Campo inválido';
  }
}
