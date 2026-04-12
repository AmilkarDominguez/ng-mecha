import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Brand } from '../../../../../core/models/brand.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface BrandFormData {
  brand?: Brand;
}

@Component({
  selector: 'app-brand-form-modal',
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
  templateUrl: './brand-form-modal.html',
  styleUrl: './brand-form-modal.scss',
})
export class BrandFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BrandFormModal>);
  private data: BrandFormData = inject(MAT_DIALOG_DATA);

  readonly scoreOptions = ['A+', 'A', 'B+', 'B', 'C'];

  get isEditMode(): boolean {
    return !!this.data?.brand;
  }

  form = this.fb.group({
    name: [null as string | null, [Validators.maxLength(100)]],
    description: [null as string | null, [Validators.maxLength(500)]],
    score: [null as string | null],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.brand) {
      this.form.patchValue({
        name: this.data.brand.name,
        description: this.data.brand.description,
        score: this.data.brand.score,
        active: this.data.brand.state === 'ACTIVE',
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
      description: raw.description || null,
      score: raw.score || null,
      state: raw.active ? 'ACTIVE' : 'INACTIVE',
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
