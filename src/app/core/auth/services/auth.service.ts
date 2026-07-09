import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { SPUser } from '../../services/supabase/sb-user';
import { PublicUser } from '../../models/user.model';

const STORAGE_KEY = 'mecha_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(SPUser);

  private readonly _currentUser = signal<PublicUser | null>(this.restoreSession());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  login(email: string, password: string): Observable<PublicUser> {
    return this.userService.login(email, password).pipe(
      map((user) => {
        if (!user) {
          throw new Error('Correo o contraseña incorrectos');
        }
        return user;
      }),
      tap((user) => {
        this._currentUser.set(user);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private restoreSession(): PublicUser | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicUser;
    } catch {
      return null;
    }
  }
}
