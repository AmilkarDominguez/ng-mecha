export interface ChartPalette {
  primary: string;
  tertiary: string;
  purple: string;
  green: string;
  red: string;
  textColor: string;
  mutedColor: string;
  gridColor: string;
  categorical: string[];
}

// Lee los mismos tokens M3 / variables de _variables.scss que ya usa el resto
// del proyecto (badges, barras de porcentaje) para que las graficas se vean
// consistentes con el tema claro/oscuro sin duplicar la paleta.
export function getChartPalette(): ChartPalette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name)?.trim() || fallback;

  const primary = read('--mat-sys-primary', '#42a5f5');
  const tertiary = read('--mat-sys-tertiary', '#26c6da');
  const purple = read('--color-badge-presentation-text', '#ce93d8');
  const green = read('--color-price-final', '#81c784');
  const red = read('--color-danger', '#ef5350');
  const textColor = read('--color-text-secondary', '#c0c0c0');
  const mutedColor = read('--color-text-muted', '#808080');
  const gridColor = read('--color-border', '#2e2e2e');

  return {
    primary,
    tertiary,
    purple,
    green,
    red,
    textColor,
    mutedColor,
    gridColor,
    categorical: [primary, tertiary, purple, green, red, mutedColor],
  };
}
