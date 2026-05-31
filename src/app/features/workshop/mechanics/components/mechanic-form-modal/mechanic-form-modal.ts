import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Contact } from '../../../../../core/models/contact.model';
import { Mechanic } from '../../../../../core/models/mechanic.model';

export interface MechanicFormData {
  mechanic?: Mechanic;
}

@Component({
  selector: 'app-mechanic-form-modal',
  imports: [
    ReactiveFormsModule,
    DialogFrame,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './mechanic-form-modal.html',
  styleUrl: './mechanic-form-modal.scss',
})
export class MechanicFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<MechanicFormModal>);
  private data: MechanicFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.mechanic;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    lastname: ['', [Validators.maxLength(150)]],
    ci: ['', [Validators.maxLength(20)]],
    nit: ['', [Validators.maxLength(20)]],
    phone: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    birthdate: [''],
    incorporated_at: [''],
    retired_at: [''],
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
    if (this.data?.mechanic) {
      const m = this.data.mechanic;
      const primary = m.contacts?.find((ct) => ct.type === 'PRIMARY');
      const secondary = m.contacts?.find((ct) => ct.type === 'SECONDARY');

      this.form.patchValue({
        name: m.name ?? '',
        lastname: m.lastname ?? '',
        ci: m.ci ?? '',
        nit: m.nit ?? '',
        phone: m.phone ?? '',
        email: m.email ?? '',
        birthdate: m.birthdate ?? '',
        incorporated_at: m.incorporated_at ?? '',
        retired_at: m.retired_at ?? '',
        address: m.address ?? '',
        active: m.state === 'ACTIVE',
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
      id: this.data.mechanic?.id || null,
      name: raw.name || null,
      lastname: raw.lastname || null,
      ci: raw.ci || null,
      nit: raw.nit || null,
      phone: raw.phone || null,
      email: raw.email || null,
      birthdate: raw.birthdate || null,
      incorporated_at: raw.incorporated_at || null,
      retired_at: raw.retired_at || null,
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
