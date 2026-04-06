import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Breed } from '../../../../../core/models/breed.model';

export interface BreedFormData {
  breed?: Breed;
}

@Component({
  selector: 'app-breed-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './breed-form-modal.html',
  styleUrl: './breed-form-modal.scss',
})
export class BreedFormModal implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BreedFormModal>);
  private data: BreedFormData = inject(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data?.breed;
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    origin: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(600)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.data?.breed) {
      this.form.patchValue({
        name: this.data.breed.name,
        origin: this.data.breed.origin,
        description: this.data.breed.description,
        isActive: this.data.breed.isActive,
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
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
