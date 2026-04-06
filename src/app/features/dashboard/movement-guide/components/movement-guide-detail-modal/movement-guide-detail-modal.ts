import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { MovementGuide, GuideStatus } from '../../../../../core/models/movement-guide.model';

@Component({
  selector: 'app-movement-guide-detail-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, DatePipe],
  templateUrl: './movement-guide-detail-modal.html',
  styleUrl: './movement-guide-detail-modal.scss',
})
export class MovementGuideDetailModal {
  private dialogRef = inject(MatDialogRef<MovementGuideDetailModal>);
  readonly guide: MovementGuide = inject(MAT_DIALOG_DATA);

  private readonly guideStatusLabels: Record<GuideStatus, string> = {
    pendiente: 'Pendiente',
    recibida: 'Recibida',
    observada: 'Observada',
    rechazada: 'Rechazada',
  };

  private readonly guideStatusClasses: Record<GuideStatus, string> = {
    pendiente: 'status-pending',
    recibida: 'status-received',
    observada: 'status-observed',
    rechazada: 'status-rejected',
  };

  statusLabel(status: GuideStatus): string {
    return this.guideStatusLabels[status];
  }

  statusClass(status: GuideStatus): string {
    return this.guideStatusClasses[status];
  }

  onPrint(): void {
    window.print();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
