import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Carrier } from '../../../../../core/models/carrier.model';

@Component({
  selector: 'app-carrier-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './carrier-delete-confirm-modal.html',
  styleUrl: './carrier-delete-confirm-modal.scss',
})
export class CarrierDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<CarrierDeleteConfirmModal>);
  readonly carrier: Carrier = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
