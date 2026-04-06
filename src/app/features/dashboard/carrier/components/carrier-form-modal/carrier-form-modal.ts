import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Carrier } from '../../../../../core/models/carrier.model';

export interface CarrierFormData {
  carrier?: Carrier;
}

@Component({
  selector: 'app-carrier-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './carrier-form-modal.html',
  styleUrl: './carrier-form-modal.scss',
})
export class CarrierFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CarrierFormModal>);
  private data: CarrierFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.carrier;
  }

  form = this.fb.group({
    businessName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    taxId: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{5,20}$/)]],
    licenseNumber: ['', [Validators.required, Validators.maxLength(30)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    vehiclePlate: ['', [Validators.required, Validators.maxLength(20)]],
    vehicleType: ['', [Validators.required, Validators.maxLength(80)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.carrier) {
      this.form.patchValue({
        businessName: this.data.carrier.businessName,
        taxId: this.data.carrier.taxId,
        licenseNumber: this.data.carrier.licenseNumber,
        phone: this.data.carrier.phone,
        email: this.data.carrier.email,
        vehiclePlate: this.data.carrier.vehiclePlate,
        vehicleType: this.data.carrier.vehicleType,
        isActive: this.data.carrier.isActive,
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
