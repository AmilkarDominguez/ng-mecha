import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

// Patron dd/MM/yyyy (o d/M/yyyy) con separador /, - o . — un solo grupo de
// captura por campo, dia y mes de 1-2 digitos, anio de 2 o 4 digitos.
const DATE_INPUT_PATTERN = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/;

/**
 * El `NativeDateAdapter` de Angular Material parsea el texto tecleado con
 * `Date.parse()`, que interpreta "1/9/2026" como MM/DD/YYYY (9 de enero)
 * en vez de DD/MM/YYYY (1 de septiembre) — sin importar el locale
 * configurado, que solo afecta el formato de *despliegue*, no el de
 * parseo. Este adaptador intercepta el texto tecleado y lo interpreta
 * siempre como dia/mes/anio antes de delegar cualquier otro caso (ISO,
 * objetos Date, etc.) al adaptador nativo.
 */
@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const match = trimmed.match(DATE_INPUT_PATTERN);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        let year = Number(match[3]);
        if (match[3].length <= 2) {
          year += year < 50 ? 2000 : 1900;
        }

        const date = new Date(year, month, day);
        const isRealCalendarDate =
          date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
        return isRealCalendarDate ? date : new Date(NaN);
      }
    }

    return super.parse(value);
  }
}
