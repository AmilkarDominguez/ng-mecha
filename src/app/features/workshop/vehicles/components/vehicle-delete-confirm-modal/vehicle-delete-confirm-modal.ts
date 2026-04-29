import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Vehicle } from '../../../../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './vehicle-delete-confirm-modal.html',
  styleUrl: './vehicle-delete-confirm-modal.scss',
})
export class VehicleDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<VehicleDeleteConfirmModal>);
  readonly vehicle: Vehicle = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
