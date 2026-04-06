import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { User, UserRole } from '../../../../../core/models/user.model';

export interface UserFormData {
  user?: User;
}

@Component({
  selector: 'app-user-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './user-form-modal.html',
  styleUrl: './user-form-modal.scss',
})
export class UserFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserFormModal>);
  private data: UserFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.user;
  }

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'operador', label: 'Operador' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'visualizador', label: 'Visualizador' },
  ];

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    username: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]{3,30}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(30)]],
    role: ['' as UserRole, Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.user) {
      this.form.patchValue({
        firstName: this.data.user.firstName,
        lastName: this.data.user.lastName,
        username: this.data.user.username,
        email: this.data.user.email,
        phone: this.data.user.phone,
        role: this.data.user.role,
        isActive: this.data.user.isActive,
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
    if (control.errors['pattern']) return 'Solo minúsculas, números y guión bajo (3-30 caracteres)';
    return 'Campo inválido';
  }
}
