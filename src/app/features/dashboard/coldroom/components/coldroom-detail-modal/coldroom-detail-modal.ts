import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ColdRoom } from '../../../../../core/models/coldroom.model';

@Component({
  selector: 'app-coldroom-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './coldroom-detail-modal.html',
  styleUrl: './coldroom-detail-modal.scss',
})
export class ColdRoomDetailModal {
  private dialogRef = inject(MatDialogRef<ColdRoomDetailModal>);
  readonly coldRoom: ColdRoom = inject(MAT_DIALOG_DATA);

  get occupancyPercent(): number {
    if (this.coldRoom.capacity === 0) return 0;
    return Math.round((this.coldRoom.currentOccupancy / this.coldRoom.capacity) * 100);
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
