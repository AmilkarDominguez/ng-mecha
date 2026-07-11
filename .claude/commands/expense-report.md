Crea el reporte de Egresos: lista los movimientos de `bank_account_histories` cuyo tipo de transacción es EGRESO, con filtros por cuenta bancaria (selección múltiple) y rango de fechas.

Utiliza un razonamiento: adaptive thinking

## Contexto

Es el equivalente exacto de `/income-report` (`.claude/commands/income-report.md`, ya implementado en `src/app/features/accounting/income-report/`) pero filtrando `transaction_type.type = 'EXPENSE'` en vez de `'INCOME'`. Lee ese comando primero — este documento solo detalla las diferencias.

**Generaliza en vez de duplicar:** con este segundo reporte ya hay dos consumidores del mismo tipo de query (income y expense), así que en `sb-bank-account-history.ts` **generaliza** el método `getIncome(filters: IncomeReportFilters)` existente a `getByTransactionKind(kind: BankTransactionKind, filters: TransactionReportFilters): Observable<BankAccountHistory[]>`, donde `BankTransactionKind` es el tipo `'INCOME' | 'EXPENSE'` ya definido en `bank-transaction-type.model.ts`. Renombra la interfaz `IncomeReportFilters` a `TransactionReportFilters` (mismos campos: `bankAccountIds?`, `from?`, `to?`). Actualiza `income-report-dashboard.ts` para llamar `getByTransactionKind('INCOME', filters)` en vez de `getIncome(filters)` — no debe quedar código duplicado ni un método `getIncome` huérfano.

Actualmente `bank_account_histories` **no tiene ningún registro de tipo EXPENSE** (los únicos módulos que escriben en esa tabla son los pagos de orden de servicio, que son INCOME) — el reporte debe renderizar correctamente el estado vacío ("Sin egresos registrados...") sin errores.

## Pasos

1. **Generaliza `sb-bank-account-history.ts`** (ver "Generaliza en vez de duplicar" arriba).
   - Importa `BankTransactionKind` desde `../../models/bank-transaction-type.model`.
   - `getByTransactionKind` arma el mismo query que tenía `getIncome`, cambiando `.eq('transaction_type.type', 'INCOME')` por `.eq('transaction_type.type', kind)`.

2. **Crea el feature `src/app/features/accounting/expense-report/`**
   - Mismo patrón que `income-report/`: `expense-report-dashboard.ts/html/scss`, componente `ExpenseReportDashboard`.
   - Mismos imports y misma estructura de `FormGroup` de filtros (`bank_account_ids`, `from`, `to`).
   - `search()` llama a `historyService.getByTransactionKind('EXPENSE', {...})`.

3. **Diferencias de copy/UI respecto a `income-report`**
   - Título: "Reporte de Egresos". Subtítulo: "Movimientos de egreso registrados en las cuentas bancarias".
   - Resumen: "Total Egresos" en vez de "Total Ingresos".
   - Mensaje de tabla vacía: "Sin egresos registrados en el rango seleccionado."
   - En `expense-report-dashboard.scss`, usa `var(--mat-sys-error)` para `.summary-value` (en vez de `var(--mat-sys-primary)` que usa el de ingresos) — ayuda a distinguir visualmente egresos de ingresos de un vistazo, mismo criterio que la clase `.summary-debt` en `service-order-detail-modal.scss`.

4. **Ruta**
   - En `src/app/app.routes.ts`, junto a `cuentas/ingresos`:
     ```typescript
     {
       path: 'cuentas/egresos',
       loadComponent: () => import('./features/accounting/expense-report/expense-report-dashboard').then(m => m.ExpenseReportDashboard),
     },
     ```

5. **Menú de navegación**
   - En `nav-menu.ts`, dentro de `title: 'Cuentas'`, junto al ítem "Ingresos":
     ```typescript
     { label: 'Egresos', icon: 'trending_down', route: '/dashboard/cuentas/egresos' },
     ```

## Consideraciones

- No dupliques la lógica de query — es el mismo motivo por el que se generaliza `getIncome` → `getByTransactionKind` en el paso 1. Si en el futuro se agrega un tercer reporte por tipo, debe poder reusar el mismo método.
- No modifica la base de datos — solo lectura sobre `bank_account_histories`.
- Verifica que el build no rompa `income-report-dashboard.ts` tras el rename del método.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP directo.
