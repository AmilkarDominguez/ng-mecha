import { Injectable } from '@angular/core';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkshopSettings } from '../../models/workshop-settings.model';

@Injectable({ providedIn: 'root' })
export class SPWorkshopSettings {
  private supabase: SupabaseClient;
  private data$ = new BehaviorSubject<WorkshopSettings | null>(null);
  private listening = false;

  private readonly TABLE_NAME = 'workshop_settings';
  private readonly LOGO_BUCKET = 'workshop-logo';

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Entidad singleton: siempre existe exactamente una fila (sembrada por
  // migracion). No hay add()/delete() de UI para este servicio.
  public get(): Observable<WorkshopSettings> {
    return from(this.supabase.from(this.TABLE_NAME).select('*').limit(1).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as WorkshopSettings;
      }),
    );
  }

  public update(item: WorkshopSettings): Observable<WorkshopSettings> {
    const { id, singleton, created_at, updated_at, ...payload } = item;
    return from(
      this.supabase.from(this.TABLE_NAME).update(payload).eq('id', id).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error en Supabase:', error.message);
          throw error;
        }
        return data as WorkshopSettings;
      }),
    );
  }

  public listen(): Observable<WorkshopSettings | null> {
    this.get().subscribe((settings) => this.data$.next(settings));

    if (!this.listening) {
      this.listening = true;
      this.supabase
        .channel('workshop-settings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: this.TABLE_NAME }, () => {
          this.get().subscribe((settings) => this.data$.next(settings));
        })
        .subscribe();
    }

    return this.data$.asObservable();
  }

  // Sube el logo al bucket de Storage y retorna la URL publica resultante
  // (se guarda en workshop_settings.logo_url mediante update()).
  public uploadLogo(file: File): Observable<string> {
    const extension = file.name.split('.').pop() || 'png';
    const path = `logo-${Date.now()}.${extension}`;

    return from(
      this.supabase.storage
        .from(this.LOGO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return this.supabase.storage.from(this.LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
      }),
    );
  }
}
