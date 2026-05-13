import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-user-delete-confirm-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './user-delete-confirm-modal.html',
  styleUrl: './user-delete-confirm-modal.scss',
})
export class UserDeleteConfirmModal {
  private dialogRef = inject(MatDialogRef<UserDeleteConfirmModal>);
  readonly user: User = inject(MAT_DIALOG_DATA);

  get fullName(): string {
    const parts = [this.user.name, this.user.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : this.user.email;
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
