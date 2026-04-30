import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Mechanic } from '../../../../../core/models/mechanic.model';

@Component({
  selector: 'app-mechanic-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './mechanic-detail-modal.html',
  styleUrl: './mechanic-detail-modal.scss',
})
export class MechanicDetailModal {
  private dialogRef = inject(MatDialogRef<MechanicDetailModal>);
  readonly mechanic: Mechanic = inject(MAT_DIALOG_DATA);

  get fullName(): string {
    const parts = [this.mechanic.name, this.mechanic.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  get primaryContact() {
    return this.mechanic.contacts?.find((c) => c.type === 'PRIMARY') ?? null;
  }

  get secondaryContact() {
    return this.mechanic.contacts?.find((c) => c.type === 'SECONDARY') ?? null;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
