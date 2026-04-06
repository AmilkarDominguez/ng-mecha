import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Gender } from '../../../../../core/models/gender.model';

@Component({
  selector: 'app-gender-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './gender-detail-modal.html',
  styleUrl: './gender-detail-modal.scss',
})
export class GenderDetailModal {
  private dialogRef = inject(MatDialogRef<GenderDetailModal>);
  readonly gender: Gender = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
