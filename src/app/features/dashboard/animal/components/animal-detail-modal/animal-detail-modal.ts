import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { Animal, AnimalStatus } from '../../../../../core/models/animal.model';

@Component({
  selector: 'app-animal-detail-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, DatePipe],
  templateUrl: './animal-detail-modal.html',
  styleUrl: './animal-detail-modal.scss',
})
export class AnimalDetailModal {
  private dialogRef = inject(MatDialogRef<AnimalDetailModal>);
  readonly animal: Animal = inject(MAT_DIALOG_DATA);

  private readonly statusLabels: Record<AnimalStatus, string> = {
    en_corral: 'En Corral',
    en_faena: 'En Faena',
    despachado: 'Despachado',
    muerto: 'Muerto',
    cuarentena: 'Cuarentena',
  };

  private readonly statusClasses: Record<AnimalStatus, string> = {
    en_corral: 'status-pen',
    en_faena: 'status-slaughter',
    despachado: 'status-dispatched',
    muerto: 'status-dead',
    cuarentena: 'status-quarantine',
  };

  statusLabel(status: AnimalStatus): string {
    return this.statusLabels[status];
  }

  statusClass(status: AnimalStatus): string {
    return this.statusClasses[status];
  }

  onPrint(): void {
    window.print();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
