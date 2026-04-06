import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Animal, AnimalStatus } from '../../../../../core/models/animal.model';

export interface AnimalFormData {
  animal?: Animal;
}

@Component({
  selector: 'app-animal-form-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './animal-form-modal.html',
  styleUrl: './animal-form-modal.scss',
})
export class AnimalFormModal implements OnInit {
  private dialogRef = inject(MatDialogRef<AnimalFormModal>);
  private fb = inject(FormBuilder);
  readonly data: AnimalFormData = inject(MAT_DIALOG_DATA);

  isEdit = false;

  readonly statusOptions: { value: AnimalStatus; label: string }[] = [
    { value: 'en_corral', label: 'En Corral' },
    { value: 'en_faena', label: 'En Faena' },
    { value: 'despachado', label: 'Despachado' },
    { value: 'muerto', label: 'Muerto' },
    { value: 'cuarentena', label: 'Cuarentena' },
  ];

  form = this.fb.group({
    tag: ['', [Validators.required, Validators.maxLength(30)]],
    lotNumber: ['', [Validators.required, Validators.maxLength(20)]],
    guideNumber: ['', [Validators.required, Validators.maxLength(30)]],
    rancher: ['', [Validators.required, Validators.maxLength(120)]],
    breed: ['', [Validators.required, Validators.maxLength(60)]],
    gender: ['', [Validators.required, Validators.maxLength(30)]],
    pen: ['', [Validators.required, Validators.maxLength(60)]],
    entryWeight: [null as number | null, [Validators.required, Validators.min(1), Validators.max(9999)]],
    entryDate: ['', Validators.required],
    status: ['en_corral' as AnimalStatus, Validators.required],
    observations: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    const animal = this.data?.animal;
    if (animal) {
      this.isEdit = true;
      this.form.patchValue({
        ...animal,
        entryDate: this.toDateInput(animal.entryDate),
      });
    }
  }

  private toDateInput(date: Date): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      ...raw,
      entryDate: new Date(raw.entryDate!),
      entryWeight: Number(raw.entryWeight),
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
