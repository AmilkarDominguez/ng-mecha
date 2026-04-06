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
import { Label } from '../../../../../core/models/label.model';

export interface LabelFormData {
  label?: Label;
}

@Component({
  selector: 'app-label-form-modal',
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
  templateUrl: './label-form-modal.html',
  styleUrl: './label-form-modal.scss',
})
export class LabelFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<LabelFormModal>);
  private data: LabelFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.label;
  }

  readonly labelTypeOptions = [
    { value: 'etiqueta_1', label: 'Etiqueta 1 — Cambio de Patas' },
    { value: 'etiqueta_2', label: 'Etiqueta 2 — Balanza de Faena (Peso Caliente)' },
    { value: 'etiqueta_3', label: 'Etiqueta 3 — Despacho (Peso Final)' },
  ];

  readonly statusOptions = [
    { value: 'impresa', label: 'Impresa' },
    { value: 'anulada', label: 'Anulada' },
    { value: 'reimpresa', label: 'Reimpresa' },
  ];

  readonly weightTypeOptions = [
    { value: '', label: '— Sin peso —' },
    { value: 'caliente', label: 'Caliente' },
    { value: 'frio', label: 'Frío' },
  ];

  form = this.fb.group({
    labelCode: ['', [Validators.required, Validators.maxLength(40)]],
    labelType: ['etiqueta_2', Validators.required],
    printedAt: [null as Date | null, Validators.required],
    carcassCode: ['', [Validators.required, Validators.maxLength(40)]],
    animalTag: ['', [Validators.required, Validators.maxLength(50)]],
    lotNumber: ['', [Validators.required, Validators.maxLength(30)]],
    rancher: ['', [Validators.required, Validators.maxLength(150)]],
    slaughterDate: [null as Date | null, Validators.required],
    weight: [null as number | null, [Validators.min(1), Validators.max(999)]],
    weightType: ['' as string],
    destination: ['', Validators.maxLength(150)],
    printedBy: ['', [Validators.required, Validators.maxLength(100)]],
    status: ['impresa', Validators.required],
    observations: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    if (this.data?.label) {
      const l = this.data.label;
      this.form.patchValue({
        labelCode: l.labelCode,
        labelType: l.labelType,
        printedAt: l.printedAt,
        carcassCode: l.carcassCode,
        animalTag: l.animalTag,
        lotNumber: l.lotNumber,
        rancher: l.rancher,
        slaughterDate: l.slaughterDate,
        weight: l.weight,
        weightType: l.weightType ?? '',
        destination: l.destination,
        printedBy: l.printedBy,
        status: l.status,
        observations: l.observations,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    this.dialogRef.close({
      ...value,
      weightType: value.weightType || null,
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
    if (control.errors['max']) return `El valor máximo es ${control.errors['max'].max}`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
