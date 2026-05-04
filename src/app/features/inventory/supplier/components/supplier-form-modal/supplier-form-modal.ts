import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Contact } from '../../../../../core/models/contact.model';
import { Supplier } from '../../../../../core/models/supplier.model';

export interface SupplierFormData {
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './supplier-form-modal.html',
  styleUrl: './supplier-form-modal.scss',
})
export class SupplierFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SupplierFormModal>);
  private data: SupplierFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.supplier;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    nit: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(20)]],
    address: ['', [Validators.maxLength(300)]],
    description: ['', [Validators.maxLength(100)]],
    active: [true],
    contacts: this.fb.group({
      primary: this.fb.group({
        name: ['', [Validators.maxLength(100)]],
        number: ['', [Validators.maxLength(20)]],
      }),
      secondary: this.fb.group({
        name: ['', [Validators.maxLength(100)]],
        number: ['', [Validators.maxLength(20)]],
      }),
    }),
  });

  ngOnInit(): void {
    if (this.data?.supplier) {
      const s = this.data.supplier;
      const primary = s.contacts?.find((ct) => ct.type === 'PRIMARY');
      const secondary = s.contacts?.find((ct) => ct.type === 'SECONDARY');

      this.form.patchValue({
        name: s.name,
        nit: s.nit ?? '',
        email: s.email ?? '',
        phone: s.phone ?? '',
        address: s.address ?? '',
        description: s.description ?? '',
        active: s.state === 'ACTIVE',
        contacts: {
          primary: { name: primary?.name ?? '', number: primary?.number ?? '' },
          secondary: { name: secondary?.name ?? '', number: secondary?.number ?? '' },
        },
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    const contacts: Contact[] = [];

    const p = raw.contacts?.primary;
    if (p?.name || p?.number) {
      contacts.push({ name: p.name || null, number: p.number || null, type: 'PRIMARY' });
    }

    const s = raw.contacts?.secondary;
    if (s?.name || s?.number) {
      contacts.push({ name: s.name || null, number: s.number || null, type: 'SECONDARY' });
    }

    this.dialogRef.close({
      name: raw.name!,
      nit: raw.nit || null,
      email: raw.email || null,
      phone: raw.phone || null,
      address: raw.address || null,
      description: raw.description || null,
      state: raw.active ? 'ACTIVE' : 'INACTIVE',
      contacts,
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Ingrese un correo electrónico válido';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  getContactError(group: 'primary' | 'secondary', field: string): string {
    const control = this.form.get(`contacts.${group}.${field}`);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
