import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Warehouse } from '../../../../../core/models/warehouse.model';

@Component({
  selector: 'app-warehouse-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './warehouse-detail-modal.html',
  styleUrl: './warehouse-detail-modal.scss',
})
export class WarehouseDetailModal {
  private dialogRef = inject(MatDialogRef<WarehouseDetailModal>);
  readonly warehouse: Warehouse = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
