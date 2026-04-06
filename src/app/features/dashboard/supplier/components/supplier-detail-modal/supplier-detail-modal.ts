import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Supplier } from '../../../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './supplier-detail-modal.html',
  styleUrl: './supplier-detail-modal.scss',
})
export class SupplierDetailModal {
  private dialogRef = inject(MatDialogRef<SupplierDetailModal>);
  readonly supplier: Supplier = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
