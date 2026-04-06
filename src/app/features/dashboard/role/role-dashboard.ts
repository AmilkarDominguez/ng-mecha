import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role } from '../../../core/models/role.model';
import { ROLE_MOCK } from './role.mock';
import { RoleTable } from './components/role-table/role-table';
import { RoleFormModal, RoleFormData } from './components/role-form-modal/role-form-modal';
import { RoleDetailModal } from './components/role-detail-modal/role-detail-modal';
import { RoleDeleteConfirmModal } from './components/role-delete-confirm-modal/role-delete-confirm-modal';

@Component({
  selector: 'app-role-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RoleTable,
  ],
  templateUrl: './role-dashboard.html',
  styleUrl: './role-dashboard.scss',
})
export class RoleDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private roles = signal<Role[]>(ROLE_MOCK);
  searchTerm = signal('');

  filteredRoles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.roles();
    return this.roles().filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.code.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(RoleFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: {} satisfies RoleFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newRole: Role = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.roles.update(list => [newRole, ...list]);
      this.snackBar.open('Rol registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(role: Role): void {
    const ref = this.dialog.open(RoleFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: { role } satisfies RoleFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.roles.update(list =>
        list.map(r => r.id === role.id
          ? { ...r, ...result, updatedAt: new Date() }
          : r
        )
      );
      this.snackBar.open('Rol actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(role: Role): void {
    this.dialog.open(RoleDetailModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: role,
    });
  }

  onDelete(role: Role): void {
    const ref = this.dialog.open(RoleDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: role,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.roles.update(list => list.filter(r => r.id !== role.id));
      this.snackBar.open('Rol eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
