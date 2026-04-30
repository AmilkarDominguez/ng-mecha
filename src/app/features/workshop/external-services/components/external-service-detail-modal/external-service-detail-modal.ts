import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ExternalService } from '../../../../../core/models/external-service.model';

@Component({
  selector: 'app-external-service-detail-modal',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './external-service-detail-modal.html',
  styleUrl: './external-service-detail-modal.scss',
})
export class ExternalServiceDetailModal {
  private dialogRef = inject(MatDialogRef<ExternalServiceDetailModal>);
  readonly externalService: ExternalService = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
