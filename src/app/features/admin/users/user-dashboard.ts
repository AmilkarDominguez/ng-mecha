import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../../core/models/user.model';
import { SPUser } from '../../../core/services/supabase/sb-user';
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
  private service = inject(SPUser);

  readonly users = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(
      (u) =>
        (u.name ?? '').toLowerCase().includes(term) ||
        (u.lastname ?? '').toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.rol.toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(UserFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {} satisfies UserFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newUser: User = {
        ...result,
        id: crypto.randomUUID(),
        allow_deletion: true,
      };

      this.service.add(newUser).subscribe(() => {
        this.snackBar.open('Usuario registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(user: User): void {
    const ref = this.dialog.open(UserFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: { user } satisfies UserFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      const payload: User = {
        ...user,
        ...result,
        password: result.password ?? user.password,
      };

      this.service.update(payload).subscribe(() => {
        this.snackBar.open('Usuario actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(user: User): void {
    this.dialog.open(UserDetailModal, {
      width: '38rem',
      maxWidth: '95vw',
      data: user,
    });
  }

  onDelete(user: User): void {
    if (!user.allow_deletion) {
      this.snackBar.open('Este usuario no puede ser eliminado', 'Cerrar', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(UserDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: user,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(user.id).subscribe(() => {
        this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
