import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BankAccount } from '../../../../../core/models/bank-account.model';

export interface BankAccountFormData {
  account?: BankAccount;
}

@Component({
  selector: 'app-bank-account-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './bank-account-form-modal.html',
  styleUrl: './bank-account-form-modal.scss',
})
export class BankAccountFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BankAccountFormModal>);
  private data: BankAccountFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.account;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    number: ['', [Validators.maxLength(50)]],
    balance: [null as number | null, [Validators.min(0)]],
    description: ['', [Validators.maxLength(500)]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.account) {
      this.form.patchValue({
        name: this.data.account.name ?? '',
        number: this.data.account.number ?? '',
        balance: this.data.account.balance,
        description: this.data.account.description ?? '',
        active: this.data.account.state === 'ACTIVE',
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
      id: this.data.account?.id || null,
      name: raw.name || null,
      number: raw.number || null,
      balance: raw.balance ?? null,
      description: raw.description || null,
      state: raw.active ? 'ACTIVE' : 'INACTIVE',
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return 'El saldo no puede ser negativo';
    return 'Campo inválido';
  }
}
