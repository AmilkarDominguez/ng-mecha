import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../../../../core/models/role.model';

@Component({
  selector: 'app-role-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './role-delete-confirm-modal.html',
  styleUrl: './role-delete-confirm-modal.scss',
})
export class RoleDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<RoleDeleteConfirmModal>);
  readonly role: Role = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
