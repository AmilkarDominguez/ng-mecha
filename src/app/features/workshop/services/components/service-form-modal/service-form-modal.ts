import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Service } from '../../../../../core/models/service.model';

export interface ServiceFormData {
  service?: Service;
}

@Component({
  selector: 'app-service-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './service-form-modal.html',
  styleUrl: './service-form-modal.scss',
})
export class ServiceFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ServiceFormModal>);
  private data: ServiceFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.service;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    code: ['', [Validators.maxLength(50)]],
    price: [null as number | null, [Validators.min(0)]],
    description: ['', [Validators.maxLength(500)]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.service) {
      const s = this.data.service;
      this.form.patchValue({
        name: s.name ?? '',
        code: s.code ?? '',
        price: s.price ?? null,
        description: s.description ?? '',
        active: s.state === 'ACTIVE',
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
      id: this.data.service?.id || null,
      name: raw.name || null,
      code: raw.code || null,
      price: raw.price ?? null,
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
    if (control.errors['min']) return 'El valor no puede ser negativo';
    return 'Campo inválido';
  }
}
