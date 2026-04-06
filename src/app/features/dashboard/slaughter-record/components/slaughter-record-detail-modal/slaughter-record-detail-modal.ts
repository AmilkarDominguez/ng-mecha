import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { SlaughterRecord } from '../../../../../core/models/slaughter-record.model';

@Component({
  selector: 'app-slaughter-record-detail-modal',
  imports: [
    DatePipe,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './slaughter-record-detail-modal.html',
  styleUrl: './slaughter-record-detail-modal.scss',
})
export class SlaughterRecordDetailModal {
  private dialogRef = inject(MatDialogRef<SlaughterRecordDetailModal>);
  readonly record: SlaughterRecord = inject(MAT_DIALOG_DATA);

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      procesado: 'Procesado',
      en_camara: 'En Cámara',
      despachado: 'Despachado',
    };
    return map[status] ?? status;
  }

  inspectionLabel(result: string): string {
    const map: Record<string, string> = {
      aprobado: 'Aprobado',
      observado: 'Observado',
      rechazado: 'Rechazado',
    };
    return map[result] ?? result;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
