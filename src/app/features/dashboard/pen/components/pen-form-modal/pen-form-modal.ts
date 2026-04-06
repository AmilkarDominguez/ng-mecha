import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Pen, PenType } from '../../../../../core/models/pen.model';

export interface PenFormData {
  pen?: Pen;
}

@Component({
  selector: 'app-pen-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './pen-form-modal.html',
  styleUrl: './pen-form-modal.scss',
})
export class PenFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PenFormModal>);
  private data: PenFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.pen;
  }

  readonly penTypes: { value: PenType; label: string }[] = [
    { value: 'espera', label: 'Espera' },
    { value: 'cuarentena', label: 'Cuarentena' },
    { value: 'faena', label: 'Pre-Faena' },
    { value: 'descanso', label: 'Descanso' },
    { value: 'enfermeria', label: 'Enfermería' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-]{2,15}$/)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['' as PenType, Validators.required],
    capacity: [null as number | null, [Validators.required, Validators.min(1), Validators.max(9999)]],
    currentOccupancy: [0, [Validators.required, Validators.min(0), Validators.max(9999)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.pen) {
      this.form.patchValue({
        name: this.data.pen.name,
        code: this.data.pen.code,
        location: this.data.pen.location,
        type: this.data.pen.type,
        capacity: this.data.pen.capacity,
        currentOccupancy: this.data.pen.currentOccupancy,
        isActive: this.data.pen.isActive,
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
    if (control.errors['pattern']) return 'Solo mayúsculas, números y guiones (2-15 caracteres)';
    return 'Campo inválido';
  }
}
