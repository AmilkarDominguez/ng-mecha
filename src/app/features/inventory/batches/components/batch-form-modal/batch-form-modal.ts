import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
    MatSlideToggleModule,
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
    product_id: ['', [Validators.required]],
    warehouse_id: ['', [Validators.required]],
    supplier_id: ['', [Validators.required]],
    industry_id: ['', [Validators.required]],
    brand_id: [null as string | null],
    code: [null as string | null, [Validators.maxLength(80)]],
    stock: [null as number | null, [Validators.min(0)]],
    wholesale_price: [null as number | null, [Validators.min(0)]],
    retail_price: [null as number | null, [Validators.min(0)]],
    final_price: [null as number | null, [Validators.min(0)]],
    description: [null as string | null, [Validators.maxLength(500)]],
    brand: [null as string | null, [Validators.maxLength(100)]],
    model: [null as string | null, [Validators.maxLength(100)]],
    expiration_date: [null as string | Date | null],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.batch) {
      const batch = this.data.batch;
      this.form.patchValue({
        product_id: batch.product_id,
        warehouse_id: batch.warehouse_id,
        supplier_id: batch.supplier_id,
        industry_id: batch.industry_id,
        brand_id: batch.brand_id,
        code: batch.code,
        stock: batch.stock,
        wholesale_price: batch.wholesale_price,
        retail_price: batch.retail_price,
        final_price: batch.final_price,
        description: batch.description,
        brand: batch.brand,
        model: batch.model,
        expiration_date: batch.expiration_date ?? null,
        active: batch.state === 'ACTIVE',
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
      product_id: raw.product_id!,
      warehouse_id: raw.warehouse_id!,
      supplier_id: raw.supplier_id!,
      industry_id: raw.industry_id!,
      brand_id: raw.brand_id || null,
      code: raw.code || null,
      stock: raw.stock !== null && raw.stock !== undefined ? Number(raw.stock) : null,
      wholesale_price: raw.wholesale_price !== null && raw.wholesale_price !== undefined ? Number(raw.wholesale_price) : null,
      retail_price: raw.retail_price !== null && raw.retail_price !== undefined ? Number(raw.retail_price) : null,
      final_price: raw.final_price !== null && raw.final_price !== undefined ? Number(raw.final_price) : null,
      description: raw.description || null,
      brand: raw.brand || null,
      model: raw.model || null,
      expiration_date: raw.expiration_date || null,
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
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['maxlength'])
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
