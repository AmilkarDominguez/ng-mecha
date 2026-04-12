import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface ProductPresentationFormData {
  presentation?: ProductPresentation;
}

@Component({
  selector: 'app-product-presentation-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './product-presentation-form-modal.html',
  styleUrl: './product-presentation-form-modal.scss',
})
export class ProductPresentationFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductPresentationFormModal>);
  private data: ProductPresentationFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.presentation;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.maxLength(20), Validators.pattern(/^[A-Z0-9]+$/)]],
    description: ['', [Validators.maxLength(500)]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.presentation) {
      this.form.patchValue({
        name: this.data.presentation.name ?? '',
        code: this.data.presentation.code ?? '',
        description: this.data.presentation.description ?? '',
        active: this.data.presentation.state === 'ACTIVE',
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
      name: raw.name || null,
      code: raw.code || null,
      description: raw.description || null,
      state: raw.active ? 'ACTIVE' : 'INACTIVE'
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
    if (control.errors['pattern']) {
      if (field === 'code') return 'Solo letras mayúsculas y números (ej. UND, LT)';
      return 'Solo letras minúsculas, números y guiones (ej. mi-presentacion)';
    }
    return 'Campo inválido';
  }
}
