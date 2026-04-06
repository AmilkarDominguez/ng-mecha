import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../core/models/user.model';
import { USER_MOCK } from './user.mock';
import { UserTable } from './components/user-table/user-table';
import { UserFormModal, UserFormData } from './components/user-form-modal/user-form-modal';
import { UserDetailModal } from './components/user-detail-modal/user-detail-modal';
import { UserDeleteConfirmModal } from './components/user-delete-confirm-modal/user-delete-confirm-modal';

@Component({
  selector: 'app-user-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    UserTable,
  ],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss',
})
export class UserDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private users = signal<User[]>(USER_MOCK);
  searchTerm = signal('');

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(u =>
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(UserFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: {} satisfies UserFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const newUser: User = {
        ...result,
        id: crypto.randomUUID(),
        isActive: result.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.update(list => [newUser, ...list]);
      this.snackBar.open('Usuario registrado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onEdit(user: User): void {
    const ref = this.dialog.open(UserFormModal, {
      width: '46rem',
      maxWidth: '95vw',
      data: { user } satisfies UserFormData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.users.update(list =>
        list.map(u => u.id === user.id
          ? { ...u, ...result, updatedAt: new Date() }
          : u
        )
      );
      this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
    });
  }

  onView(user: User): void {
    this.dialog.open(UserDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: user,
    });
  }

  onDelete(user: User): void {
    const ref = this.dialog.open(UserDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: user,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.users.update(list => list.filter(u => u.id !== user.id));
      this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
    });
  }
}
