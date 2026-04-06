import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  imports: [MatListModule, MatIconModule, MatDividerModule, MatExpansionModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss',
})
export class NavMenu {
  readonly modules: NavModule[] = [
    {
      title: 'Inventario',
      icon: 'inventory',
      items: [
        { label: 'Categorías', icon: 'category', route: '/dashboard/inventario/categorias' },
        { label: 'Presentaciones', icon: 'inventory_2', route: '/dashboard/inventario/presentaciones' },
        { label: 'Almacenes', icon: 'warehouse', route: '/dashboard/inventario/almacenes' },
        { label: 'Marcas', icon: 'branding_watermark', route: '/dashboard/inventario/marcas' },
        { label: 'Industrias / Sectores', icon: 'factory', route: '/dashboard/inventario/industrias' },
        { label: 'Proveedores', icon: 'storefront', route: '/dashboard/compras/proveedores' },
        { label: 'Productos', icon: 'inventory', route: '/dashboard/inventario/productos' },
        { label: 'Lotes', icon: 'add_box', route: '/dashboard/inventario/lotes' },
      ],
    },
    {
      title: 'Auditoría y Reportes',
      icon: 'fact_check',
      items: [
      ],
    },
  ];
}
