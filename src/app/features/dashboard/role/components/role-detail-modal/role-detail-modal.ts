import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Role } from '../../../../../core/models/role.model';

@Component({
  selector: 'app-role-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './role-detail-modal.html',
  styleUrl: './role-detail-modal.scss',
})
export class RoleDetailModal {
  private dialogRef = inject(MatDialogRef<RoleDetailModal>);
  readonly role: Role = inject(MAT_DIALOG_DATA);

  permissionGroups(): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const perm of this.role.permissions) {
      const [module] = perm.split('.');
      if (!groups[module]) groups[module] = [];
      groups[module].push(perm);
    }
    return groups;
  }

  groupKeys(): string[] {
    return Object.keys(this.permissionGroups());
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
