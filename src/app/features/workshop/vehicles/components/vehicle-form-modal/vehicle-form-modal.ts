import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { toSignal } from '@angular/core/rxjs-interop';
import { Vehicle } from '../../../../../core/models/vehicle.model';
import { Customer } from '../../../../../core/models/customer.model';
import { SPCustomer } from '../../../../../core/services/supabase/sb-customer';

export interface VehicleFormData {
  vehicle?: Vehicle;
}

@Component({
  selector: 'app-vehicle-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './vehicle-form-modal.html',
  styleUrl: './vehicle-form-modal.scss',
})
export class VehicleFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<VehicleFormModal>);
  private data: VehicleFormData = inject(MAT_DIALOG_DATA);

  readonly customers = toSignal(inject(SPCustomer).get(), { initialValue: [] });

  readonly customerCtrl = new FormControl<Customer | string | null>(null);
  private readonly customerCtrlValue = toSignal(this.customerCtrl.valueChanges, {
    initialValue: null,
  });

  readonly filteredCustomers = computed(() => {
    const val = this.customerCtrlValue();
    if (!val || typeof val !== 'string') return this.customers();
    const term = val.toLowerCase().trim();
    if (!term) return this.customers();
    return this.customers().filter((c) => this.customerLabel(c).toLowerCase().includes(term));
  });

  get isEditMode(): boolean {
    return !!this.data?.vehicle;
  }

  form = this.fb.group({
    license_plate: ['', [Validators.required, Validators.maxLength(20)]],
    brand: ['', [Validators.maxLength(100)]],
    model: ['', [Validators.maxLength(100)]],
    displacement: ['', [Validators.maxLength(50)]],
    year: ['', [Validators.maxLength(4)]],
    chassis_number: ['', [Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    active: [true],
  });

  constructor() {
    effect(() => {
      const customers = this.customers();
      const vehicleCustomerId = this.data?.vehicle?.customer_id;
      if (vehicleCustomerId && customers.length > 0 && !this.customerCtrl.value) {
        const found = customers.find((c) => c.id === vehicleCustomerId);
        if (found) this.customerCtrl.setValue(found, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    if (this.data?.vehicle) {
      const v = this.data.vehicle;
      this.form.patchValue({
        license_plate: v.license_plate ?? '',
        brand: v.brand ?? '',
        model: v.model ?? '',
        displacement: v.displacement ?? '',
        year: v.year ?? '',
        chassis_number: v.chassis_number ?? '',
        description: v.description ?? '',
        active: v.state === 'ACTIVE',
      });
    }
  }

  displayCustomer = (value: Customer | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.customerLabel(value);
  };

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    const customerVal = this.customerCtrl.value;
    const customerId =
      customerVal && typeof customerVal !== 'string' ? customerVal.id : null;

    this.dialogRef.close({
      customer_id: customerId,
      license_plate: raw.license_plate || null,
      brand: raw.brand || null,
      model: raw.model || null,
      displacement: raw.displacement || null,
      year: raw.year || null,
      chassis_number: raw.chassis_number || null,
      description: raw.description || null,
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
    if (control.errors['maxlength'])
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  customerLabel(c: Customer): string {
    return [c.name, c.lastname].filter(Boolean).join(' ') || c.id;
  }
}
