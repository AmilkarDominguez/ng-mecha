/**
 * Convierte una columna DATE de Postgres ("yyyy-MM-dd", sin hora) a un Date
 * en medianoche LOCAL. `new Date("yyyy-MM-dd")` directo interpreta ese
 * string como medianoche UTC (regla del spec de ECMAScript para fechas sin
 * hora) — en Bolivia (UTC-4) eso se lee un dia antes al consultar
 * getDate()/getMonth()/getFullYear() en hora local, que es justo lo que
 * hace el datepicker de Angular Material al mostrar el valor. Usar siempre
 * esta funcion (nunca `new Date(isoDateString)`) para precargar un
 * FormControl<Date> desde una columna DATE.
 */
export function parseLocalDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/**
 * Inversa de parseLocalDate: formatea un Date como "yyyy-MM-dd" a partir de
 * sus componentes LOCALES. Nunca usar `date.toISOString().split('T')[0]`
 * para esto — toISOString() convierte a UTC primero, lo que puede mover la
 * fecha un dia en zonas horarias con offset distinto al de Bolivia.
 */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
