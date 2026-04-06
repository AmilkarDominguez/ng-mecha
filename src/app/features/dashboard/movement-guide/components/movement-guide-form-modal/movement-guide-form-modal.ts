import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MovementGuide, GuideStatus } from '../../../../../core/models/movement-guide.model';

export interface MovementGuideFormData {
  guide?: MovementGuide;
}

@Component({
  selector: 'app-movement-guide-form-modal',
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
  templateUrl: './movement-guide-form-modal.html',
  styleUrl: './movement-guide-form-modal.scss',
})
export class MovementGuideFormModal implements OnInit {
  private dialogRef = inject(MatDialogRef<MovementGuideFormModal>);
  private fb = inject(FormBuilder);
  readonly data: MovementGuideFormData = inject(MAT_DIALOG_DATA);

  isEdit = false;

  readonly statusOptions: { value: GuideStatus; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'recibida', label: 'Recibida' },
    { value: 'observada', label: 'Observada' },
    { value: 'rechazada', label: 'Rechazada' },
  ];

  form = this.fb.group({
    guideNumber: ['', [Validators.required, Validators.maxLength(30)]],
    issueDate: ['', Validators.required],
    expiryDate: ['', Validators.required],
    rancher: ['', [Validators.required, Validators.maxLength(120)]],
    carrier: ['', [Validators.required, Validators.maxLength(120)]],
    vehiclePlate: ['', [Validators.required, Validators.maxLength(10)]],
    originLocation: ['', [Validators.required, Validators.maxLength(150)]],
    destinationLocation: ['', [Validators.required, Validators.maxLength(150)]],
    animalCount: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
    status: ['pendiente' as GuideStatus, Validators.required],
    observations: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    const guide = this.data?.guide;
    if (guide) {
      this.isEdit = true;
      this.form.patchValue({
        ...guide,
        issueDate: this.toDateInputValue(guide.issueDate),
        expiryDate: this.toDateInputValue(guide.expiryDate),
      });
    }
  }

  private toDateInputValue(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      ...raw,
      issueDate: new Date(raw.issueDate!),
      expiryDate: new Date(raw.expiryDate!),
      animalCount: Number(raw.animalCount),
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
