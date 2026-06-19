import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { User } from '../../../../../core/models/user.model';
import { DialogFrame } from '../../../../../shared/components/dialog-frame/dialog-frame';

@Component({
  selector: 'app-user-detail-modal',
  imports: [
    DatePipe,
    DialogFrame,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './user-detail-modal.html',
  styleUrl: './user-detail-modal.scss',
})
export class UserDetailModal {
  private dialogRef = inject(MatDialogRef<UserDetailModal>);
  readonly user: User = inject(MAT_DIALOG_DATA);

  readonly roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    SALES: 'Ventas',
    INVENTORY: 'Inventario',
  };

  get fullName(): string {
    const parts = [this.user.name, this.user.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
