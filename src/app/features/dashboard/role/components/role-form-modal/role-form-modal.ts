import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Role } from '../../../../../core/models/role.model';

export interface RoleFormData {
  role?: Role;
}

@Component({
  selector: 'app-role-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './role-form-modal.html',
  styleUrl: './role-form-modal.scss',
})
export class RoleFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RoleFormModal>);
  private data: RoleFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.role;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]{2,30}$/)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    permissionsRaw: ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.role) {
      this.form.patchValue({
        name: this.data.role.name,
        code: this.data.role.code,
        description: this.data.role.description,
        permissionsRaw: this.data.role.permissions.join('\n'),
        isActive: this.data.role.isActive,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value.permissionsRaw ?? '';
    const permissions = raw
      .split(/[\n,]+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    this.dialogRef.close({ ...this.form.value, permissions });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Solo minúsculas, números y guión bajo (2-30 caracteres)';
    return 'Campo inválido';
  }
}
