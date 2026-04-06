import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Warehouse } from '../../../../../core/models/warehouse.model';

@Component({
  selector: 'app-warehouse-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './warehouse-delete-confirm-modal.html',
  styleUrl: './warehouse-delete-confirm-modal.scss',
})
export class WarehouseDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<WarehouseDeleteConfirmModal>);
  readonly warehouse: Warehouse = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
