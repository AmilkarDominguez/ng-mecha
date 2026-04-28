import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Contact } from '../../../../../core/models/contact.model';
import { Customer } from '../../../../../core/models/customer.model';

export interface CustomerFormData {
  customer?: Customer;
}

@Component({
  selector: 'app-customer-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './customer-form-modal.html',
  styleUrl: './customer-form-modal.scss',
})
export class CustomerFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomerFormModal>);
  private data: CustomerFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.customer;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    lastname: ['', [Validators.maxLength(150)]],
    ci: ['', [Validators.maxLength(20)]],
    expedition_ci: ['', [Validators.maxLength(10)]],
    code_ci: ['', [Validators.maxLength(10)]],
    nit: ['', [Validators.maxLength(20)]],
    phone: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    birthdate: [''],
    address: ['', [Validators.maxLength(300)]],
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
    if (this.data?.customer) {
      const c = this.data.customer;
      const primary = c.contacts?.find((ct) => ct.type === 'PRIMARY');
      const secondary = c.contacts?.find((ct) => ct.type === 'SECONDARY');

      this.form.patchValue({
        name: c.name ?? '',
        lastname: c.lastname ?? '',
        ci: c.ci ?? '',
        expedition_ci: c.expedition_ci ?? '',
        code_ci: c.code_ci ?? '',
        nit: c.nit ?? '',
        phone: c.phone ?? '',
        email: c.email ?? '',
        birthdate: c.birthdate ?? '',
        address: c.address ?? '',
        active: c.state === 'ACTIVE',
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
      id: this.data.customer?.id || null,
      name: raw.name || null,
      lastname: raw.lastname || null,
      ci: raw.ci || null,
      expedition_ci: raw.expedition_ci || null,
      code_ci: raw.code_ci || null,
      nit: raw.nit || null,
      phone: raw.phone || null,
      email: raw.email || null,
      birthdate: raw.birthdate || null,
      address: raw.address || null,
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
    if (control.errors['email']) return 'Correo electrónico inválido';
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
