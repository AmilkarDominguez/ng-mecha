import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, switchMap } from 'rxjs';
import { WorkshopSettings } from '../../../core/models/workshop-settings.model';
import { SPWorkshopSettings } from '../../../core/services/supabase/sb-workshop-settings';

const MAX_LOGO_SIZE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-settings-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-form.html',
  styleUrl: './settings-form.scss',
})
export class SettingsForm implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPWorkshopSettings);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly logoPreviewUrl = signal<string | null>(null);
  readonly logoError = signal<string | null>(null);

  private settingsId = '';
  private selectedLogoFile: File | null = null;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    slogan: ['', [Validators.maxLength(300)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    address: ['', [Validators.maxLength(500)]],
    contact_phone_1: ['', [Validators.maxLength(30)]],
    contact_phone_2: ['', [Validators.maxLength(30)]],
    facebook_url: ['', [Validators.maxLength(300)]],
    instagram_url: ['', [Validators.maxLength(300)]],
    website_url: ['', [Validators.maxLength(300)]],
    tiktok_url: ['', [Validators.maxLength(300)]],
    extra_url_1: ['', [Validators.maxLength(300)]],
    extra_url_2: ['', [Validators.maxLength(300)]],
    next_order_number: [null as number | null],
    show_in_print: [true],
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.loading.set(true);
    this.service.get().subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar la configuración', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private applySettings(settings: WorkshopSettings): void {
    this.settingsId = settings.id;
    this.logoPreviewUrl.set(settings.logo_url);
    this.form.patchValue({
      name: settings.name ?? '',
      slogan: settings.slogan ?? '',
      email: settings.email ?? '',
      address: settings.address ?? '',
      contact_phone_1: settings.contact_phone_1 ?? '',
      contact_phone_2: settings.contact_phone_2 ?? '',
      facebook_url: settings.facebook_url ?? '',
      instagram_url: settings.instagram_url ?? '',
      website_url: settings.website_url ?? '',
      tiktok_url: settings.tiktok_url ?? '',
      extra_url_1: settings.extra_url_1 ?? '',
      extra_url_2: settings.extra_url_2 ?? '',
      next_order_number: settings.next_order_number,
      show_in_print: settings.show_in_print,
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    if (file.type !== 'image/png') {
      this.logoError.set('Solo se permite formato PNG');
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      this.logoError.set('El logo no puede superar los 10MB');
      return;
    }

    this.logoError.set(null);
    this.selectedLogoFile = file;
    this.logoPreviewUrl.set(URL.createObjectURL(file));
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();

    const logo$ = this.selectedLogoFile
      ? this.service.uploadLogo(this.selectedLogoFile)
      : of(this.logoPreviewUrl());

    logo$
      .pipe(
        switchMap((logoUrl) =>
          this.service.update({
            id: this.settingsId,
            name: raw.name || '',
            slogan: raw.slogan || null,
            email: raw.email || null,
            address: raw.address || null,
            contact_phone_1: raw.contact_phone_1 || null,
            contact_phone_2: raw.contact_phone_2 || null,
            facebook_url: raw.facebook_url || null,
            instagram_url: raw.instagram_url || null,
            website_url: raw.website_url || null,
            tiktok_url: raw.tiktok_url || null,
            extra_url_1: raw.extra_url_1 || null,
            extra_url_2: raw.extra_url_2 || null,
            next_order_number: raw.next_order_number,
            logo_url: logoUrl,
            show_in_print: raw.show_in_print ?? true,
          }),
        ),
      )
      .subscribe({
        next: (settings) => {
          this.applySettings(settings);
          this.selectedLogoFile = null;
          this.saving.set(false);
          this.snackBar.open('Configuración guardada correctamente', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Error al guardar la configuración', 'Cerrar', { duration: 3000 });
        },
      });
  }

  onReset(): void {
    this.selectedLogoFile = null;
    this.logoError.set(null);
    this.loadSettings();
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['email']) return 'Correo inválido';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
