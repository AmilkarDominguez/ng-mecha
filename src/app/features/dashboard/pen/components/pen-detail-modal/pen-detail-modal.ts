import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Pen, PenType } from '../../../../../core/models/pen.model';

@Component({
  selector: 'app-pen-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './pen-detail-modal.html',
  styleUrl: './pen-detail-modal.scss',
})
export class PenDetailModal {
  private dialogRef = inject(MatDialogRef<PenDetailModal>);
  readonly pen: Pen = inject(MAT_DIALOG_DATA);

  readonly penTypeLabels: Record<PenType, string> = {
    cuarentena: 'Cuarentena',
    espera: 'Espera',
    faena: 'Pre-Faena',
    descanso: 'Descanso',
    enfermeria: 'Enfermería',
  };

  get occupancyPercent(): number {
    if (this.pen.capacity === 0) return 0;
    return Math.round((this.pen.currentOccupancy / this.pen.capacity) * 100);
  }

  get occupancyColor(): string {
    const pct = this.occupancyPercent;
    if (pct >= 90) return 'warn';
    if (pct >= 70) return 'accent';
    return 'primary';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
