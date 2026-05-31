import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Brand } from '../../../../../core/models/brand.model';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';

@Component({
  selector: 'app-brand-detail-modal',
  imports: [
    DatePipe,
    DialogFrame,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './brand-detail-modal.html',
  styleUrl: './brand-detail-modal.scss',
})
export class BrandDetailModal {
  private dialogRef = inject(MatDialogRef<BrandDetailModal>);
  readonly brand: Brand = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
