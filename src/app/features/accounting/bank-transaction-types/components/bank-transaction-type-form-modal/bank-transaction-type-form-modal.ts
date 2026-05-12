import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BankTransactionType } from '../../../../../core/models/bank-transaction-type.model';

export interface BankTransactionTypeFormData {
  item?: BankTransactionType;
}

@Component({
  selector: 'app-bank-transaction-type-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule, // estado activo/inactivo
    MatIconModule,
  ],
  templateUrl: './bank-transaction-type-form-modal.html',
  styleUrl: './bank-transaction-type-form-modal.scss',
})
export class BankTransactionTypeFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BankTransactionTypeFormModal>);
  private data: BankTransactionTypeFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.item;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(500)]],
    type: [null as string | null],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.item) {
      this.form.patchValue({
        name: this.data.item.name ?? '',
        description: this.data.item.description ?? '',
        type: this.data.item.type ?? null,
        active: this.data.item.state === 'ACTIVE',
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
      id: this.data.item?.id || null,
      name: raw.name || null,
      description: raw.description || null,
      type: raw.type || null,
      allow_deletion: this.data.item?.allow_deletion ?? true,
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
    return 'Campo inválido';
  }
}
