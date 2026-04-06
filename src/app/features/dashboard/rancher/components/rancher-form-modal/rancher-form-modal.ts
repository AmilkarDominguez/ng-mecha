import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Rancher } from '../../../../../core/models/rancher.model';

export interface RancherFormData {
  rancher?: Rancher;
}

@Component({
  selector: 'app-rancher-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './rancher-form-modal.html',
  styleUrl: './rancher-form-modal.scss',
})
export class RancherFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RancherFormModal>);
  private data: RancherFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.rancher;
  }

  form = this.fb.group({
    businessName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    taxId: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{5,20}$/)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.rancher) {
      this.form.patchValue({
        businessName: this.data.rancher.businessName,
        taxId: this.data.rancher.taxId,
        phone: this.data.rancher.phone,
        address: this.data.rancher.address,
        email: this.data.rancher.email,
        isActive: this.data.rancher.isActive,
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
    if (control.errors['email']) return 'Ingrese un correo electrónico válido';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Formato inválido (solo letras, números y guiones, 5-20 caracteres)';
    return 'Campo inválido';
  }
}
