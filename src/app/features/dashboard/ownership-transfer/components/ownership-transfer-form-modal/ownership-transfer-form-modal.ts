import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OwnershipTransfer } from '../../../../../core/models/ownership-transfer.model';

export interface OwnershipTransferFormData {
  transfer?: OwnershipTransfer;
}

@Component({
  selector: 'app-ownership-transfer-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './ownership-transfer-form-modal.html',
  styleUrl: './ownership-transfer-form-modal.scss',
})
export class OwnershipTransferFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<OwnershipTransferFormModal>);
  private data: OwnershipTransferFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.transfer;
  }

  readonly animalOptions = [
    'FR-SC-01-001', 'FR-SC-01-002', 'FR-SC-01-003', 'FR-SC-01-004',
    'FR-SC-02-001', 'FR-SC-02-002', 'FR-SC-02-003',
    'FR-BN-01-001', 'FR-BN-01-002', 'FR-BN-01-003',
    'FR-BN-02-001', 'FR-BN-02-002',
    'FR-BN-03-001', 'FR-SC-03-001', 'FR-SC-03-002',
  ];

  readonly rancherOptions = [
    'Estancia El Prado S.R.L.',
    'Agropecuaria Los Llanos',
    'Juan Carlos Vaca Díez',
    'Ganadería Santa Rosa',
    'Hermanos Suárez Agropecuaria',
    'Finca Bella Vista',
    'Rojas & Asociados Ganadería',
    'Corporación Ganadera del Oriente',
  ];

  readonly brandOptions = [
    'Marca EP',
    'Marca LL',
    'Marca JCV',
    'Marca SR',
    'Marca HSA',
    'Marca BV',
    'Marca RA',
    'Marca CGO',
  ];

  form = this.fb.group({
    animalTag: ['', [Validators.required]],
    fromRancherName: ['', [Validators.required]],
    fromBrandName: ['', [Validators.required]],
    toRancherName: ['', [Validators.required]],
    toBrandName: ['', [Validators.required]],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
    supportDocUrl: ['', [Validators.maxLength(500)]],
    transferredAt: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.data?.transfer) {
      const t = this.data.transfer;
      const dateStr = t.transferredAt instanceof Date
        ? t.transferredAt.toISOString().slice(0, 16)
        : String(t.transferredAt).slice(0, 16);
      this.form.patchValue({
        animalTag: t.animalTag,
        fromRancherName: t.fromRancherName,
        fromBrandName: t.fromBrandName,
        toRancherName: t.toRancherName,
        toBrandName: t.toBrandName,
        reason: t.reason,
        supportDocUrl: t.supportDocUrl,
        transferredAt: dateStr,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
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
