import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Industry } from '../../../../../core/models/industry.model';

export interface IndustryFormData {
  industry?: Industry;
}

@Component({
  selector: 'app-industry-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './industry-form-modal.html',
  styleUrl: './industry-form-modal.scss',
})
export class IndustryFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<IndustryFormModal>);
  private data: IndustryFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.industry;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    slug: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', [Validators.maxLength(500)]],
    state: ['ACTIVE' as 'ACTIVE' | 'INACTIVE'],
  });

  ngOnInit(): void {
    if (this.data?.industry) {
      this.form.patchValue({
        name: this.data.industry.name,
        slug: this.data.industry.slug,
        description: this.data.industry.description ?? '',
        state: this.data.industry.state,
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
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Solo letras minúsculas, números y guiones (ej. automoviles-camionetas)';
    return 'Campo inválido';
  }
}
