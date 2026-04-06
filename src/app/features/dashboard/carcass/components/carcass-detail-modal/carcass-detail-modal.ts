import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Carcass } from '../../../../../core/models/carcass.model';

@Component({
  selector: 'app-carcass-detail-modal',
  imports: [
    DatePipe,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './carcass-detail-modal.html',
  styleUrl: './carcass-detail-modal.scss',
})
export class CarcassDetailModal {
  private dialogRef = inject(MatDialogRef<CarcassDetailModal>);
  readonly carcass: Carcass = inject(MAT_DIALOG_DATA);

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      en_camara: 'En Cámara',
      despachado: 'Despachado',
      decomisada: 'Decomisada',
    };
    return map[status] ?? status;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
