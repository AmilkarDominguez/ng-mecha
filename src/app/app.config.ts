import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MAT_DATE_LOCALE, MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';

// Formato dia/mes/anio para todos los datepickers de Angular Material.
// El adaptador nativo combina estas opciones de Intl con MAT_DATE_LOCALE
// ('es-BO') para renderizar el input como "dd/MM/yyyy".
export const APP_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideNativeDateAdapter(APP_DATE_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'es-BO' },
  ],
};
