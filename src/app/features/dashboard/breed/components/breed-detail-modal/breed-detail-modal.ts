import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Breed } from '../../../../../core/models/breed.model';

@Component({
  selector: 'app-breed-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './breed-detail-modal.html',
  styleUrl: './breed-detail-modal.scss',
})
export class BreedDetailModal {
  private dialogRef = inject(MatDialogRef<BreedDetailModal>);
  readonly breed: Breed = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
