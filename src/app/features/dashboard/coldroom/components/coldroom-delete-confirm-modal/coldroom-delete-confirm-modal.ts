import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ColdRoom } from '../../../../../core/models/coldroom.model';

@Component({
  selector: 'app-coldroom-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './coldroom-delete-confirm-modal.html',
  styleUrl: './coldroom-delete-confirm-modal.scss',
})
export class ColdRoomDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<ColdRoomDeleteConfirmModal>);
  readonly coldRoom: ColdRoom = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
