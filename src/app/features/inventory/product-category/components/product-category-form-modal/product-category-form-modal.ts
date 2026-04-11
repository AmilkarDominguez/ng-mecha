import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProductCategory } from '../../../../../core/models/product-category.model';

export interface ProductCategoryFormData {
  category?: ProductCategory;
}

@Component({
  selector: 'app-product-category-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './product-category-form-modal.html',
  styleUrl: './product-category-form-modal.scss',
})
export class ProductCategoryFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductCategoryFormModal>);
  private data: ProductCategoryFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.category;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    title: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(500)]],
    icon: ['', [Validators.maxLength(100)]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.category) {
      this.form.patchValue({
        name: this.data.category.name ?? '',
        title: this.data.category.title ?? '',
        description: this.data.category.description ?? '',
        icon: this.data.category.icon ?? '',
        active: this.data.category.state === 'ACTIVE',
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
      title: raw.title || null,
      description: raw.description || null,
      icon: raw.icon || null,
      state: raw.active ? 'ACTIVE' : 'INACTIVE',
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
    return 'Campo inválido';
  }
}
