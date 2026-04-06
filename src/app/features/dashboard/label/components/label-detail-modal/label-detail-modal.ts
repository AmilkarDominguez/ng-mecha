import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Label } from '../../../../../core/models/label.model';

@Component({
  selector: 'app-label-detail-modal',
  imports: [
    DatePipe,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './label-detail-modal.html',
  styleUrl: './label-detail-modal.scss',
})
export class LabelDetailModal {
  private dialogRef = inject(MatDialogRef<LabelDetailModal>);
  readonly label: Label = inject(MAT_DIALOG_DATA);

  labelTypeDisplay(type: string): string {
    const map: Record<string, string> = {
      etiqueta_1: 'Etiqueta 1 — Cambio de Patas',
      etiqueta_2: 'Etiqueta 2 — Balanza de Faena',
      etiqueta_3: 'Etiqueta 3 — Despacho',
    };
    return map[type] ?? type;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      impresa: 'Impresa',
      anulada: 'Anulada',
      reimpresa: 'Reimpresa',
    };
    return map[status] ?? status;
  }

  weightTypeLabel(type: string | null): string {
    if (!type) return '—';
    return type === 'caliente' ? 'Caliente' : 'Frío';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
