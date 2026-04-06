import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Batch } from '../../../../../core/models/batch.model';
import { Product } from '../../../../../core/models/product.model';
import { Warehouse } from '../../../../../core/models/warehouse.model';
import { Supplier } from '../../../../../core/models/supplier.model';
import { Industry } from '../../../../../core/models/industry.model';
import { Brand } from '../../../../../core/models/brand.model';

export interface BatchFormData {
  batch?: Batch;
  products: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  industries: Industry[];
  brands: Brand[];
}

@Component({
  selector: 'app-batch-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './batch-form-modal.html',
  styleUrl: './batch-form-modal.scss',
})
export class BatchFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BatchFormModal>);
  readonly data: BatchFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.batch;
  }

  form = this.fb.group({
    productId: ['', [Validators.required]],
    warehouseId: ['', [Validators.required]],
    supplierId: ['', [Validators.required]],
    industryId: ['', [Validators.required]],
    brandId: [null as string | null],
    code: [null as string | null, [Validators.maxLength(80)]],
    stock: [null as number | null, [Validators.min(0)]],
    wholesalePrice: [null as number | null, [Validators.min(0)]],
    retailPrice: [null as number | null, [Validators.min(0)]],
    finalPrice: [null as number | null, [Validators.min(0)]],
    description: [null as string | null, [Validators.maxLength(500)]],
    brand: [null as string | null, [Validators.maxLength(100)]],
    model: [null as string | null, [Validators.maxLength(100)]],
    expirationDate: [null as string | null],
    state: ['ACTIVE' as 'ACTIVE' | 'INACTIVE'],
  });

  ngOnInit(): void {
    if (this.data?.batch) {
      const b = this.data.batch;
      this.form.patchValue({
        productId: b.productId,
        warehouseId: b.warehouseId,
        supplierId: b.supplierId,
        industryId: b.industryId,
        brandId: b.brandId,
        code: b.code,
        stock: b.stock,
        wholesalePrice: b.wholesalePrice,
        retailPrice: b.retailPrice,
        finalPrice: b.finalPrice,
        description: b.description,
        brand: b.brand,
        model: b.model,
        expirationDate: b.expirationDate
          ? b.expirationDate.toISOString().substring(0, 10)
          : null,
        state: b.state,
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
      productId: raw.productId!,
      warehouseId: raw.warehouseId!,
      supplierId: raw.supplierId!,
      industryId: raw.industryId!,
      brandId: raw.brandId || null,
      code: raw.code || null,
      stock: raw.stock !== null && raw.stock !== undefined ? Number(raw.stock) : null,
      wholesalePrice: raw.wholesalePrice !== null && raw.wholesalePrice !== undefined ? Number(raw.wholesalePrice) : null,
      retailPrice: raw.retailPrice !== null && raw.retailPrice !== undefined ? Number(raw.retailPrice) : null,
      finalPrice: raw.finalPrice !== null && raw.finalPrice !== undefined ? Number(raw.finalPrice) : null,
      description: raw.description || null,
      brand: raw.brand || null,
      model: raw.model || null,
      expirationDate: raw.expirationDate ? new Date(raw.expirationDate) : null,
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
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
