import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { User, UserRole } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-user-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
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

  private readonly roleLabels: Record<UserRole, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    operador: 'Operador',
    auditor: 'Auditor',
    visualizador: 'Visualizador',
  };

  roleLabel(role: UserRole): string {
    return this.roleLabels[role];
  }

  get fullName(): string {
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
