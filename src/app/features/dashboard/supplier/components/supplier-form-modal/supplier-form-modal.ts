import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Supplier } from '../../../../../core/models/supplier.model';

export interface SupplierFormData {
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './supplier-form-modal.html',
  styleUrl: './supplier-form-modal.scss',
})
export class SupplierFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SupplierFormModal>);
  private data: SupplierFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.supplier;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    address: ['', [Validators.maxLength(300)]],
    description: ['', [Validators.maxLength(1000)]],
    state: ['ACTIVE' as 'ACTIVE' | 'INACTIVE'],
  });

  ngOnInit(): void {
    if (this.data?.supplier) {
      this.form.patchValue({
        name: this.data.supplier.name,
        slug: this.data.supplier.slug,
        email: this.data.supplier.email ?? '',
        address: this.data.supplier.address ?? '',
        description: this.data.supplier.description ?? '',
        state: this.data.supplier.state,
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
      name: raw.name!,
      slug: raw.slug!,
      email: raw.email || null,
      address: raw.address || null,
      description: raw.description || null,
      state: raw.state ?? 'ACTIVE',
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Ingrese un correo electrónico válido';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Solo letras minúsculas, números y guiones (ej. mi-proveedor)';
    return 'Campo inválido';
  }
}
