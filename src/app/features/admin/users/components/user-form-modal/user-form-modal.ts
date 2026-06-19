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
import { User, UserRole } from '../../../../../core/models/user.model';

export interface UserFormData {
  user?: User;
}

@Component({
  selector: 'app-user-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
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

  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SALES', label: 'Ventas' },
    { value: 'INVENTORY', label: 'Inventario' },
  ];

  showPassword = false;

  form = this.fb.group({
    name: ['', [Validators.maxLength(150)]],
    lastname: ['', [Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: [''],
    rol: ['INVENTORY' as UserRole, [Validators.required]],
    active: [true],
  });

  ngOnInit(): void {
    const passwordControl = this.form.get('password')!;
    if (!this.isEditMode) {
      passwordControl.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      passwordControl.setValidators([Validators.minLength(6)]);
    }
    passwordControl.updateValueAndValidity();

    if (this.data?.user) {
      this.form.patchValue({
        name: this.data.user.name ?? '',
        lastname: this.data.user.lastname ?? '',
        email: this.data.user.email,
        password: '',
        rol: this.data.user.rol,
        active: this.data.user.state === 'ACTIVE',
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    const result: Partial<User> = {
      name: raw.name || null,
      lastname: raw.lastname || null,
      email: raw.email ?? '',
      rol: raw.rol as UserRole,
      state: raw.active ? 'ACTIVE' : 'INACTIVE',
      allow_deletion: true,
    };

    if (!this.isEditMode || (raw.password && raw.password.length > 0)) {
      result.password = raw.password ?? '';
    }

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Correo electrónico inválido';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
