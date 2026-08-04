import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/auth/guards/auth.guard';
import { publicGuard } from './core/auth/guards/public.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [publicGuard],
    children: [
      { path: 'login', component: Login }
    ]
  },
  {
    path: 'dashboard',
    component: AdminLayout,
    canActivate: [authGuard],
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
      {
        path: 'cuentas/cuentas-bancarias',
        loadComponent: () => import('./features/accounting/bank-accounts/bank-account-dashboard').then(m => m.BankAccountDashboard),
      },
      {
        path: 'cuentas/tipos-transaccion',
        loadComponent: () => import('./features/accounting/bank-transaction-types/bank-transaction-type-dashboard').then(m => m.BankTransactionTypeDashboard),
      },
      {
        path: 'cuentas/ingresos',
        loadComponent: () => import('./features/accounting/income-report/income-report-dashboard').then(m => m.IncomeReportDashboard),
      },
      {
        path: 'cuentas/registro-ingresos',
        loadComponent: () => import('./features/accounting/income-register/income-register-dashboard').then(m => m.IncomeRegisterDashboard),
      },
      {
        path: 'cuentas/egresos',
        loadComponent: () => import('./features/accounting/expense-report/expense-report-dashboard').then(m => m.ExpenseReportDashboard),
      },
      {
        path: 'cuentas/registro-egresos',
        loadComponent: () => import('./features/accounting/expense-register/expense-register-dashboard').then(m => m.ExpenseRegisterDashboard),
      },
      {
        path: 'admin/usuarios',
        loadComponent: () => import('./features/admin/users/user-dashboard').then(m => m.UserDashboard),
      },
      {
        path: 'admin/configuracion',
        loadComponent: () => import('./features/admin/settings/settings-form').then(m => m.SettingsForm),
      },
      {
        path: 'cotizaciones/activas',
        loadComponent: () => import('./features/quote/quote-dashboard/quote-dashboard').then(m => m.QuoteDashboard),
      },
      {
        path: 'cotizaciones/nueva',
        loadComponent: () => import('./features/quote/quote-form/quote-form').then(m => m.QuoteForm),
      },
      {
        path: 'cotizaciones/editar/:id',
        loadComponent: () => import('./features/quote/quote-form/quote-form').then(m => m.QuoteForm),
      },
      {
        path: 'ordenes/en-curso',
        loadComponent: () => import('./features/service-order/service-order-dashboard/service-order-dashboard').then(m => m.ServiceOrderDashboard),
      },
      {
        path: 'ordenes/nueva',
        loadComponent: () => import('./features/service-order/service-order-form/service-order-form').then(m => m.ServiceOrderForm),
      },
      {
        path: 'ordenes/editar/:id',
        loadComponent: () => import('./features/service-order/service-order-form/service-order-form').then(m => m.ServiceOrderForm),
      },
      {
        path: 'reportes/utilidades',
        loadComponent: () => import('./features/reports/utility-report/utility-report-dashboard').then(m => m.UtilityReportDashboard),
      },
      {
        path: 'reportes/productos-lotes',
        loadComponent: () => import('./features/reports/product-sales-report/product-sales-report-dashboard').then(m => m.ProductSalesReportDashboard),
      },
      {
        path: 'reportes/cumpleaneros',
        loadComponent: () => import('./features/reports/birthday-report/birthday-report-dashboard').then(m => m.BirthdayReportDashboard),
      },
      {
        path: 'reportes/lotes-stock',
        loadComponent: () => import('./features/reports/stock-report/stock-report-dashboard').then(m => m.StockReportDashboard),
      },
      {
        path: 'reportes/vehiculos-frecuentes',
        loadComponent: () => import('./features/reports/vehicle-frequency-report/vehicle-frequency-report-dashboard').then(m => m.VehicleFrequencyReportDashboard),
      },
      {
        path: 'reportes/composicion-ingresos',
        loadComponent: () => import('./features/reports/income-composition-report/income-composition-report-dashboard').then(m => m.IncomeCompositionReportDashboard),
      },
      {
        path: 'reportes/servicios-por-estado',
        loadComponent: () => import('./features/reports/service-lines-report/service-lines-report-dashboard').then(m => m.ServiceLinesReportDashboard),
      },
      {
        path: 'reportes/servicios-mas-requeridos',
        loadComponent: () => import('./features/reports/service-frequency-report/service-frequency-report-dashboard').then(m => m.ServiceFrequencyReportDashboard),
      },
      {
        path: 'reportes/servicios-por-tecnico',
        loadComponent: () => import('./features/reports/mechanic-workload-report/mechanic-workload-report-dashboard').then(m => m.MechanicWorkloadReportDashboard),
      },
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
