import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Batch } from '../../../../../core/models/batch.model';
import { Product } from '../../../../../core/models/product.model';
import { Warehouse } from '../../../../../core/models/warehouse.model';
import { Supplier } from '../../../../../core/models/supplier.model';
import { Brand } from '../../../../../core/models/brand.model';
import { SPBankAccount } from '../../../../../core/services/supabase/sb-bank-account';
import { SPProduct } from '../../../../../core/services/supabase/sb-product';
import { SPBrand } from '../../../../../core/services/supabase/sb-brand';
import { parseLocalDate, toLocalIsoDate } from '../../../../../core/date/date-utils';

export interface BatchFormData {
  batch?: Batch;
  products: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  brands: Brand[];
}

@Component({
  selector: 'app-batch-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './batch-form-modal.html',
  styleUrl: './batch-form-modal.scss',
})
export class BatchFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BatchFormModal>);
  private bankAccountService = inject(SPBankAccount);
  private productService = inject(SPProduct);
  private brandService = inject(SPBrand);
  private snackBar = inject(MatSnackBar);
  readonly data: BatchFormData = inject(MAT_DIALOG_DATA);

  private readonly bankAccounts = toSignal(this.bankAccountService.listen(), { initialValue: [] });
  readonly activeBankAccounts = computed(() => this.bankAccounts().filter((a) => a.state === 'ACTIVE'));

  // Copia local de products/brands: el registro rapido (paneles plegables de
  // abajo) agrega el item creado aqui al instante para poder seleccionarlo
  // de inmediato, sin esperar el round-trip del canal realtime de listen()
  // del dashboard que abrio este modal.
  readonly products = signal<Product[]>(this.data.products);
  readonly brands = signal<Brand[]>(this.data.brands);

  readonly creatingProduct = signal(false);
  readonly creatingBrand = signal(false);

  readonly scoreOptions = ['A+', 'A', 'B+', 'B', 'C'];

  quickProductForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  quickBrandForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    score: [null as string | null],
  });

  get isEditMode(): boolean {
    return !!this.data?.batch;
  }

  form = this.fb.group({
    product_id: ['', [Validators.required]],
    warehouse_id: ['', [Validators.required]],
    supplier_id: ['', [Validators.required]],
    brand_id: ['', [Validators.required]],
    bank_account_id: [null as string | null],
    code: [null as string | null, [Validators.maxLength(80)]],
    stock: [null as number | null, [Validators.min(0)]],
    min_stock: [null as number | null, [Validators.min(0)]],
    cost: [null as number | null, [Validators.min(0)]],
    price: [null as number | null, [Validators.min(0)]],
    description: [null as string | null, [Validators.maxLength(500)]],
    compatible_brands: [null as string | null, [Validators.maxLength(100)]],
    compatible_models: [null as string | null, [Validators.maxLength(100)]],
    expiration_date: [null as Date | null],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.batch) {
      const batch = this.data.batch;
      this.form.patchValue({
        product_id: batch.product_id,
        warehouse_id: batch.warehouse_id,
        supplier_id: batch.supplier_id,
        brand_id: batch.brand_id,
        bank_account_id: batch.bank_account_id ?? null,
        code: batch.code,
        stock: batch.stock,
        min_stock: batch.min_stock,
        cost: batch.cost,
        price: batch.price,
        description: batch.description,
        compatible_brands: batch.compatible_brands,
        compatible_models: batch.compatible_models,
        expiration_date: parseLocalDate(batch.expiration_date),
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
    const cost = raw.cost !== null && raw.cost !== undefined ? Number(raw.cost) : null;
    const stock = raw.stock !== null && raw.stock !== undefined ? Number(raw.stock) : null;

    if (raw.bank_account_id && (!cost || !stock)) {
      this.form.controls.cost.markAsTouched();
      this.form.controls.stock.markAsTouched();
      this.snackBar.open(
        'Debe indicar costo y stock mayores a 0 para registrar la compra en la cuenta bancaria.',
        'Cerrar',
        { duration: 4000 },
      );
      return;
    }

    this.dialogRef.close({
      product_id: raw.product_id!,
      warehouse_id: raw.warehouse_id!,
      supplier_id: raw.supplier_id!,
      brand_id: raw.brand_id!,
      bank_account_id: raw.bank_account_id || null,
      code: raw.code || null,
      stock,
      min_stock: raw.min_stock !== null && raw.min_stock !== undefined ? Number(raw.min_stock) : null,
      cost,
      price: raw.price !== null && raw.price !== undefined ? Number(raw.price) : null,
      description: raw.description || null,
      compatible_brands: raw.compatible_brands || null,
      compatible_models: raw.compatible_models || null,
      expiration_date: raw.expiration_date ? toLocalIsoDate(raw.expiration_date) : null,
      state: raw.active ? 'ACTIVE' : 'INACTIVE',
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  createProduct(panel: MatExpansionPanel): void {
    if (this.quickProductForm.invalid) {
      this.quickProductForm.markAllAsTouched();
      return;
    }
    const raw = this.quickProductForm.value;
    const payload: Product = {
      id: crypto.randomUUID(),
      name: raw.name || null,
      category_id: null,
      presentation_id: null,
      description: raw.description || null,
      photo: null,
      state: 'ACTIVE',
    };

    this.creatingProduct.set(true);
    this.productService.add(payload).subscribe({
      next: (saved) => {
        this.creatingProduct.set(false);
        const created = saved?.[0];
        if (!created) return;
        this.products.update((list) => [...list, created]);
        this.form.patchValue({ product_id: created.id });
        this.quickProductForm.reset();
        panel.close();
        this.snackBar.open('Producto creado y seleccionado', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.creatingProduct.set(false);
        this.snackBar.open('Error al crear el producto', 'Cerrar', { duration: 4000 });
      },
    });
  }

  createBrand(panel: MatExpansionPanel): void {
    if (this.quickBrandForm.invalid) {
      this.quickBrandForm.markAllAsTouched();
      return;
    }
    const raw = this.quickBrandForm.value;
    const payload: Brand = {
      id: crypto.randomUUID(),
      name: raw.name || null,
      description: raw.description || null,
      score: raw.score || null,
      state: 'ACTIVE',
    };

    this.creatingBrand.set(true);
    this.brandService.add(payload).subscribe({
      next: (saved) => {
        this.creatingBrand.set(false);
        const created = saved?.[0];
        if (!created) return;
        this.brands.update((list) => [...list, created]);
        this.form.patchValue({ brand_id: created.id });
        this.quickBrandForm.reset();
        panel.close();
        this.snackBar.open('Marca creada y seleccionada', 'Cerrar', { duration: 2500 });
      },
      error: () => {
        this.creatingBrand.set(false);
        this.snackBar.open('Error al crear la marca', 'Cerrar', { duration: 4000 });
      },
    });
  }

  getQuickFieldError(group: FormGroup, field: string): string {
    const control = group.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
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
