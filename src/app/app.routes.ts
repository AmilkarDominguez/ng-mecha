import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Login } from './features/auth/login/login';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

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
        path: 'catalogos/ganaderos',
        loadComponent: () => import('./features/dashboard/rancher/rancher-dashboard').then(m => m.RancherDashboard),
      },
      {
        path: 'inventario/marcas',
        loadComponent: () => import('./features/dashboard/brand/brand-dashboard').then(m => m.BrandDashboard),
      },
      {
        path: 'catalogos/razas',
        loadComponent: () => import('./features/dashboard/breed/breed-dashboard').then(m => m.BreedDashboard),
      },
      {
        path: 'catalogos/sexo',
        loadComponent: () => import('./features/dashboard/gender/gender-dashboard').then(m => m.GenderDashboard),
      },
      {
        path: 'catalogos/transportistas',
        loadComponent: () => import('./features/dashboard/carrier/carrier-dashboard').then(m => m.CarrierDashboard),
      },
      {
        path: 'catalogos/camaras',
        loadComponent: () => import('./features/dashboard/coldroom/coldroom-dashboard').then(m => m.ColdRoomDashboard),
      },
      {
        path: 'catalogos/corrales',
        loadComponent: () => import('./features/dashboard/pen/pen-dashboard').then(m => m.PenDashboard),
      },
      {
        path: 'catalogos/usuarios',
        loadComponent: () => import('./features/dashboard/user/user-dashboard').then(m => m.UserDashboard),
      },
      {
        path: 'catalogos/roles',
        loadComponent: () => import('./features/dashboard/role/role-dashboard').then(m => m.RoleDashboard),
      },
      {
        path: 'recepcion/guias',
        loadComponent: () => import('./features/dashboard/movement-guide/movement-guide-dashboard').then(m => m.MovementGuideDashboard),
      },
      {
        path: 'corrales/animales',
        loadComponent: () => import('./features/dashboard/animal/animal-dashboard').then(m => m.AnimalDashboard),
      },
      {
        path: 'corrales/transferencias',
        loadComponent: () => import('./features/dashboard/ownership-transfer/ownership-transfer-dashboard').then(m => m.OwnershipTransferDashboard),
      },
      {
        path: 'produccion/faenas',
        loadComponent: () => import('./features/dashboard/slaughter-record/slaughter-record-dashboard').then(m => m.SlaughterRecordDashboard),
      },
      {
        path: 'produccion/canales',
        loadComponent: () => import('./features/dashboard/carcass/carcass-dashboard').then(m => m.CarcassDashboard),
      },
      {
        path: 'produccion/etiquetas',
        loadComponent: () => import('./features/dashboard/label/label-dashboard').then(m => m.LabelDashboard),
      },
      {
        path: 'inventario/categorias',
        loadComponent: () => import('./features/dashboard/product-category/product-category-dashboard').then(m => m.ProductCategoryDashboard),
      },
      {
        path: 'inventario/presentaciones',
        loadComponent: () => import('./features/dashboard/product-presentation/product-presentation-dashboard').then(m => m.ProductPresentationDashboard),
      },
      {
        path: 'inventario/productos',
        loadComponent: () => import('./features/dashboard/product/product-dashboard').then(m => m.ProductDashboard),
      },
      {
        path: 'compras/proveedores',
        loadComponent: () => import('./features/dashboard/supplier/supplier-dashboard').then(m => m.SupplierDashboard),
      },
      {
        path: 'inventario/industrias',
        loadComponent: () => import('./features/dashboard/industry/industry-dashboard').then(m => m.IndustryDashboard),
      },
      {
        path: 'inventario/almacenes',
        loadComponent: () => import('./features/dashboard/warehouses/warehouse-dashboard').then(m => m.WarehouseDashboard),
      },
      {
        path: 'inventario/lotes',
        loadComponent: () => import('./features/dashboard/batches/batch-dashboard').then(m => m.BatchDashboard),
      },
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
