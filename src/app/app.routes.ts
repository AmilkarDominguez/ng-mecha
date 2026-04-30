import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login }
    ]
  },
  {
    path: 'dashboard',
    component: AdminLayout,
    //canActivate: [authGuard]
    children: [
      { path: '', component: Dashboard },
      {
        path: 'inventario/marcas',
        loadComponent: () => import('./features/inventory/brand/brand-dashboard').then(m => m.BrandDashboard),
      },
      {
        path: 'inventario/categorias',
        loadComponent: () => import('./features/inventory/product-category/product-category-dashboard').then(m => m.ProductCategoryDashboard),
      },
      {
        path: 'inventario/presentaciones',
        loadComponent: () => import('./features/inventory/product-presentation/product-presentation-dashboard').then(m => m.ProductPresentationDashboard),
      },
      {
        path: 'inventario/productos',
        loadComponent: () => import('./features/inventory/product/product-dashboard').then(m => m.ProductDashboard),
      },
      {
        path: 'compras/proveedores',
        loadComponent: () => import('./features/inventory/supplier/supplier-dashboard').then(m => m.SupplierDashboard),
      },
      {
        path: 'inventario/industrias',
        loadComponent: () => import('./features/inventory/industry/industry-dashboard').then(m => m.IndustryDashboard),
      },
      {
        path: 'inventario/almacenes',
        loadComponent: () => import('./features/inventory/warehouses/warehouse-dashboard').then(m => m.WarehouseDashboard),
      },
      {
        path: 'inventario/lotes',
        loadComponent: () => import('./features/inventory/batches/batch-dashboard').then(m => m.BatchDashboard),
      },
      {
        path: 'taller/clientes',
        loadComponent: () => import('./features/workshop/customers/customer-dashboard').then(m => m.CustomerDashboard),
      },
      {
        path: 'inventario/vehiculos',
        loadComponent: () => import('./features/workshop/vehicles/vehicle-dashboard').then(m => m.VehicleDashboard),
      },
      {
        path: 'taller/mecanicos',
        loadComponent: () => import('./features/workshop/mechanics/mechanic-dashboard').then(m => m.MechanicDashboard),
      },
      {
        path: 'taller/servicios',
        loadComponent: () => import('./features/workshop/services/service-dashboard').then(m => m.ServiceDashboard),
      },
      {
        path: 'taller/servicios-externos',
        loadComponent: () => import('./features/workshop/external-services/external-service-dashboard').then(m => m.ExternalServiceDashboard),
      },
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
