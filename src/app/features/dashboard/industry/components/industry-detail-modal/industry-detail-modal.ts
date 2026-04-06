import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Industry } from '../../../../../core/models/industry.model';

@Component({
  selector: 'app-industry-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './industry-detail-modal.html',
  styleUrl: './industry-detail-modal.scss',
})
export class IndustryDetailModal {
  private dialogRef = inject(MatDialogRef<IndustryDetailModal>);
  readonly industry: Industry = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
