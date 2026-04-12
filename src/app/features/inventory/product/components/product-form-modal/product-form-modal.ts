import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Product } from '../../../../../core/models/product.model';
import { ProductCategory } from '../../../../../core/models/product-category.model';
import { ProductPresentation } from '../../../../../core/models/product-presentation.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface ProductFormData {
  product?: Product;
  categories: ProductCategory[];
  presentations: ProductPresentation[];
}

@Component({
  selector: 'app-product-form-modal',
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
  templateUrl: './product-form-modal.html',
  styleUrl: './product-form-modal.scss',
})
export class ProductFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductFormModal>);
  private data: ProductFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.product;
  }

  get categories(): ProductCategory[] {
    return this.data.categories.filter(c => c.state === 'ACTIVE');
  }

  get presentations(): ProductPresentation[] {
    return this.data.presentations.filter(p => p.state === 'ACTIVE');
  }

  form = this.fb.group({
    name: ['', [Validators.maxLength(200)]],
    categoryId: [null as string | null],
    presentationId: [null as string | null],
    description: ['', [Validators.maxLength(1000)]],
    photo: ['', [Validators.maxLength(500)]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.product) {
      this.form.patchValue({
        name: this.data.product.name ?? '',
        categoryId: this.data.product.categoryId,
        presentationId: this.data.product.presentationId,
        description: this.data.product.description ?? '',
        photo: this.data.product.photo ?? '',
        active: this.data.product.state === 'ACTIVE',
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
      categoryId: raw.categoryId ?? null,
      presentationId: raw.presentationId ?? null,
      description: raw.description || null,
      photo: raw.photo || null,
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
