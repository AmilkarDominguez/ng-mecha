import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SlaughterRecord } from '../../../../../core/models/slaughter-record.model';

export interface SlaughterRecordFormData {
  record?: SlaughterRecord;
}

@Component({
  selector: 'app-slaughter-record-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './slaughter-record-form-modal.html',
  styleUrl: './slaughter-record-form-modal.scss',
})
export class SlaughterRecordFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<SlaughterRecordFormModal>);
  private data: SlaughterRecordFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.record;
  }

  readonly inspectionOptions = [
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'observado', label: 'Observado' },
    { value: 'rechazado', label: 'Rechazado' },
  ];

  readonly statusOptions = [
    { value: 'procesado', label: 'Procesado' },
    { value: 'en_camara', label: 'En Cámara' },
    { value: 'despachado', label: 'Despachado' },
  ];

  readonly breedOptions = ['Nelore', 'Brangus', 'Mestizo', 'Hereford', 'Angus', 'Brahman'];
  readonly genderOptions = ['Macho', 'Hembra'];

  form = this.fb.group({
    recordNumber: ['', [Validators.required, Validators.pattern(/^FR-\d{4}-\d{2}-\d{4}$/)]],
    slaughterDate: [null as Date | null, Validators.required],
    animalTag: ['', [Validators.required, Validators.maxLength(50)]],
    lotNumber: ['', [Validators.required, Validators.maxLength(30)]],
    rancher: ['', [Validators.required, Validators.maxLength(150)]],
    breed: ['', Validators.required],
    gender: ['', Validators.required],
    hotWeight: [null as number | null, [Validators.required, Validators.min(1), Validators.max(999)]],
    coldWeight: [null as number | null, [Validators.min(1), Validators.max(999)]],
    yieldPercentage: [null as number | null, [Validators.min(0), Validators.max(100)]],
    operator: ['', [Validators.required, Validators.maxLength(100)]],
    veterinaryInspection: [true],
    inspectionResult: ['aprobado', Validators.required],
    label2Code: ['', [Validators.required, Validators.maxLength(50)]],
    coldRoomAssigned: ['', Validators.maxLength(50)],
    status: ['procesado', Validators.required],
    observations: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    if (this.data?.record) {
      const r = this.data.record;
      this.form.patchValue({
        recordNumber: r.recordNumber,
        slaughterDate: r.slaughterDate,
        animalTag: r.animalTag,
        lotNumber: r.lotNumber,
        rancher: r.rancher,
        breed: r.breed,
        gender: r.gender,
        hotWeight: r.hotWeight,
        coldWeight: r.coldWeight,
        yieldPercentage: r.yieldPercentage,
        operator: r.operator,
        veterinaryInspection: r.veterinaryInspection,
        inspectionResult: r.inspectionResult,
        label2Code: r.label2Code,
        coldRoomAssigned: r.coldRoomAssigned,
        status: r.status,
        observations: r.observations,
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
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Formato inválido. Ej: FR-2026-03-0001';
    return 'Campo inválido';
  }
}
