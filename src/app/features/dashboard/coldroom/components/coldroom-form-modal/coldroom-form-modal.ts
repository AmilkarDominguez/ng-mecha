import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ColdRoom } from '../../../../../core/models/coldroom.model';

export interface ColdRoomFormData {
  coldRoom?: ColdRoom;
}

@Component({
  selector: 'app-coldroom-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './coldroom-form-modal.html',
  styleUrl: './coldroom-form-modal.scss',
})
export class ColdRoomFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ColdRoomFormModal>);
  private data: ColdRoomFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.coldRoom;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-]{2,15}$/)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    capacity: [null as number | null, [Validators.required, Validators.min(1), Validators.max(9999)]],
    currentOccupancy: [0, [Validators.required, Validators.min(0), Validators.max(9999)]],
    minTemperature: [null as number | null, [Validators.required, Validators.min(-30), Validators.max(20)]],
    maxTemperature: [null as number | null, [Validators.required, Validators.min(-30), Validators.max(20)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.coldRoom) {
      this.form.patchValue({
        name: this.data.coldRoom.name,
        code: this.data.coldRoom.code,
        location: this.data.coldRoom.location,
        capacity: this.data.coldRoom.capacity,
        currentOccupancy: this.data.coldRoom.currentOccupancy,
        minTemperature: this.data.coldRoom.minTemperature,
        maxTemperature: this.data.coldRoom.maxTemperature,
        isActive: this.data.coldRoom.isActive,
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
