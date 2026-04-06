import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Gender } from '../../../../../core/models/gender.model';

export interface GenderFormData {
  gender?: Gender;
}

@Component({
  selector: 'app-gender-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './gender-form-modal.html',
  styleUrl: './gender-form-modal.scss',
})
export class GenderFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GenderFormModal>);
  private data: GenderFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.gender;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z]{1,5}$/)]],
    description: ['', [Validators.required, Validators.maxLength(400)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.gender) {
      this.form.patchValue({
        name: this.data.gender.name,
        code: this.data.gender.code,
        description: this.data.gender.description,
        isActive: this.data.gender.isActive,
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
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Solo letras mayúsculas, máximo 5 caracteres (ej. M, H, C)';
    return 'Campo inválido';
  }
}
