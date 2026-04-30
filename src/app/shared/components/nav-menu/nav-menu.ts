import { Component, inject, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavModule {
  title: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-nav-menu',
  imports: [
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss',
})
export class NavMenu {
  onClick = output();

  readonly themeService = inject(ThemeService);

  readonly modules: NavModule[] = [
    {
      title: 'Inventario',
      icon: 'inventory',
      items: [
        { label: 'Categorías', icon: 'category', route: '/dashboard/inventario/categorias' },
        { label: 'Presentaciones', icon: 'inventory_2', route: '/dashboard/inventario/presentaciones' },
        { label: 'Productos', icon: 'inventory', route: '/dashboard/inventario/productos' },
        { label: 'Almacenes', icon: 'warehouse', route: '/dashboard/inventario/almacenes' },
        { label: 'Marcas', icon: 'branding_watermark', route: '/dashboard/inventario/marcas' },
        { label: 'Industrias', icon: 'factory', route: '/dashboard/inventario/industrias' },
        { label: 'Proveedores', icon: 'storefront', route: '/dashboard/compras/proveedores' },
        { label: 'Lotes', icon: 'add_box', route: '/dashboard/inventario/lotes' },
      ],
    },
    {
      title: 'Taller',
      icon: 'build',
      items: [
        { label: 'Clientes', icon: 'people', route: '/dashboard/taller/clientes' },
        { label: 'Mecánicos', icon: 'engineering', route: '/dashboard/taller/mecanicos' },
        { label: 'Vehículos', icon: 'directions_car', route: '/dashboard/inventario/vehiculos' },
      ],
    },
    {
      title: 'Auditoría y Reportes',
      icon: 'fact_check',
      items: [],
    },
  ];

  clickMenu(): void {
    this.onClick.emit();
  }
}
