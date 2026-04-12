import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'mecha-theme';
const DEFAULT_THEME: Theme = 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _theme = signal<Theme>(this._loadTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Apply theme to DOM and persist whenever the signal changes
    effect(() => {
      this._applyTheme(this._theme());
    });
  }

  toggle(): void {
    this._theme.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  private _loadTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
  }

  private _applyTheme(theme: Theme): void {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', 'light');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }
}
