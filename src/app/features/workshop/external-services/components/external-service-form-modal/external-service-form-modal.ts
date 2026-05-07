import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ExternalService, ExternalServicesRating } from '../../../../../core/models/external-service.model';

export interface ExternalServiceFormData {
  externalService?: ExternalService;
}

@Component({
  selector: 'app-external-service-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './external-service-form-modal.html',
  styleUrl: './external-service-form-modal.scss',
})
export class ExternalServiceFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ExternalServiceFormModal>);
  private data: ExternalServiceFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.externalService;
  }

  readonly ratingOptions: { value: ExternalServicesRating; label: string }[] = [
    { value: 'GOOD', label: 'Bueno' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'BAD', label: 'Malo' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    company_name: ['', [Validators.maxLength(200)]],
    phone: ['', [Validators.maxLength(20)]],
    rating: [null as ExternalServicesRating | null],
    cost: [null as number | null, [Validators.min(0)]],
    price: [null as number | null, [Validators.min(0)]],
    description: ['', [Validators.maxLength(500)]],
    address: ['', [Validators.maxLength(300)]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data?.externalService) {
      const s = this.data.externalService;
      this.form.patchValue({
        name: s.name ?? '',
        company_name: s.company_name ?? '',
        phone: s.phone ?? '',
        rating: s.rating ?? null,
        cost: s.cost ?? null,
        price: s.price ?? null,
        description: s.description ?? '',
        address: s.address ?? '',
        active: s.state === 'ACTIVE',
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
      id: this.data.externalService?.id || null,
      name: raw.name || null,
      company_name: raw.company_name || null,
      phone: raw.phone || null,
      rating: raw.rating || null,
      cost: raw.cost ?? null,
      price: raw.price ?? null,
      description: raw.description || null,
      address: raw.address || null,
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
    if (control.errors['min']) return 'El valor no puede ser negativo';
    return 'Campo inválido';
  }
}
