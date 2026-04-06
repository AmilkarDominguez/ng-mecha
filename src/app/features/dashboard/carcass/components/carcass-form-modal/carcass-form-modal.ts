import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Carcass } from '../../../../../core/models/carcass.model';

export interface CarcassFormData {
  carcass?: Carcass;
}

@Component({
  selector: 'app-carcass-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './carcass-form-modal.html',
  styleUrl: './carcass-form-modal.scss',
})
export class CarcassFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CarcassFormModal>);
  private data: CarcassFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.carcass;
  }

  readonly statusOptions = [
    { value: 'en_camara', label: 'En Cámara' },
    { value: 'despachado', label: 'Despachado' },
    { value: 'decomisada', label: 'Decomisada' },
  ];

  readonly breedOptions = ['Nelore', 'Brangus', 'Mestizo', 'Hereford', 'Angus', 'Brahman'];
  readonly genderOptions = ['Macho', 'Hembra'];

  form = this.fb.group({
    carcassCode: ['', [Validators.required, Validators.maxLength(30)]],
    slaughterRecordId: ['', Validators.maxLength(50)],
    slaughterDate: [null as Date | null, Validators.required],
    animalTag: ['', [Validators.required, Validators.maxLength(50)]],
    lotNumber: ['', [Validators.required, Validators.maxLength(30)]],
    rancher: ['', [Validators.required, Validators.maxLength(150)]],
    breed: ['', Validators.required],
    gender: ['', Validators.required],
    hotWeight: [null as number | null, [Validators.required, Validators.min(1), Validators.max(999)]],
    coldWeight: [null as number | null, [Validators.min(1), Validators.max(999)]],
    yieldPercentage: [null as number | null, [Validators.min(0), Validators.max(100)]],
    coldRoomAssigned: ['', Validators.maxLength(50)],
    entryDate: [null as Date | null, Validators.required],
    exitDate: [null as Date | null],
    maturationDays: [null as number | null, [Validators.min(0), Validators.max(365)]],
    label2Code: ['', [Validators.required, Validators.maxLength(50)]],
    label3Code: ['', Validators.maxLength(50)],
    status: ['en_camara', Validators.required],
    observations: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    if (this.data?.carcass) {
      const c = this.data.carcass;
      this.form.patchValue({
        carcassCode: c.carcassCode,
        slaughterRecordId: c.slaughterRecordId,
        slaughterDate: c.slaughterDate,
        animalTag: c.animalTag,
        lotNumber: c.lotNumber,
        rancher: c.rancher,
        breed: c.breed,
        gender: c.gender,
        hotWeight: c.hotWeight,
        coldWeight: c.coldWeight,
        yieldPercentage: c.yieldPercentage,
        coldRoomAssigned: c.coldRoomAssigned,
        entryDate: c.entryDate,
        exitDate: c.exitDate,
        maturationDays: c.maturationDays,
        label2Code: c.label2Code,
        label3Code: c.label3Code,
        status: c.status,
        observations: c.observations,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['max']) return `El valor máximo es ${control.errors['max'].max}`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
