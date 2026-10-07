import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';

import { routes } from './app.routes';
import { AppDateAdapter } from './core/date/app-date-adapter';

// Formato dia/mes/anio para todos los datepickers de Angular Material.
// AppDateAdapter combina estas opciones de Intl con MAT_DATE_LOCALE
// ('es-BO') para renderizar el input como "dd/MM/yyyy" Y para interpretar
// correctamente lo que el usuario teclea a mano (ver app-date-adapter.ts
// — el NativeDateAdapter por defecto parsea con Date.parse(), que lee
// "1/9/2026" como 9 de enero, no 1 de septiembre).
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
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-BO' },
  ],
};
