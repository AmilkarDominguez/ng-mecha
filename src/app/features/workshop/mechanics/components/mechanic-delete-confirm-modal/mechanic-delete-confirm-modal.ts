import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Mechanic } from '../../../../../core/models/mechanic.model';

@Component({
  selector: 'app-mechanic-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './mechanic-delete-confirm-modal.html',
  styleUrl: './mechanic-delete-confirm-modal.scss',
})
export class MechanicDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<MechanicDeleteConfirmModal>);
  readonly mechanic: Mechanic = inject(MAT_DIALOG_DATA);

  get fullName(): string {
    const parts = [this.mechanic.name, this.mechanic.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
