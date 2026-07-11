Crea el reporte de Ingresos: lista los movimientos de `bank_account_histories` cuyo tipo de transacción es INGRESO, con filtros por cuenta bancaria (selección múltiple) y rango de fechas.

Utiliza un razonamiento: adaptive thinking

## Contexto

`.claude/docs/features.md` ya contempla la ruta `Contabilidad > Ingresos` (ese módulo se llama "Cuentas" en `nav-menu.ts`, con rutas bajo `/dashboard/cuentas/...`). Es un **reporte de solo lectura** — no lleva formulario de creación/edición ni eliminación, a diferencia de los demás módulos de `src/app/features/accounting/`.

**Verificado contra el Supabase real del proyecto antes de escribir este comando:**
- `bank_account_histories` ya existe y tiene datos reales (pagos de orden de servicio).
- El filtro `select('*, transaction_type:bank_transaction_types!inner(id,name,type)').eq('transaction_type.type', 'INCOME')` funciona correctamente — PostgREST requiere `!inner` para poder filtrar por una columna de un recurso embebido.
- El modelo `BankAccountHistory` (`src/app/core/models/bank-account-history.model.ts`) **ya tiene** los campos opcionales `bank_account?: BankAccount` y `transaction_type?: BankTransactionType` — no requiere cambios.
- `transaction_reference` es un campo de texto libre (ver [[bank-account-history-payments]] / `entities.md`): para pagos de orden de servicio contiene el `service_orders.id`. Muéstralo tal cual (no resuelvas el número de orden) — está fuera de alcance de este reporte.

## Pasos

1. **Amplía el servicio Supabase `sb-bank-account-history.ts`**
   - Agrega una interfaz `IncomeReportFilters { bankAccountIds?: string[]; from?: string; to?: string }` (fechas en formato `YYYY-MM-DD`).
   - Agrega un método `getIncome(filters: IncomeReportFilters): Observable<BankAccountHistory[]>` que:
     - Construye el query con `this.supabase.from(this.TABLE_NAME).select('*, bank_account:bank_accounts(id,name,number), transaction_type:bank_transaction_types!inner(id,name,type)').eq('transaction_type.type', 'INCOME').order('created_at', { ascending: false })`.
     - Si `filters.bankAccountIds` tiene elementos, encadena `.in('bank_account_id', filters.bankAccountIds)`.
     - Si `filters.from`, encadena `.gte('created_at', filters.from + 'T00:00:00')`.
     - Si `filters.to`, encadena `.lte('created_at', filters.to + 'T23:59:59')`.
     - Retorna `from(query).pipe(map(({ data, error }) => { if (error) throw error; return data ?? []; }))`.
   - No modifiques `get()` ni `getByReference()` — este es un método adicional, específico del reporte.

2. **Crea el feature `src/app/features/accounting/income-report/`**
   - Sigue la estructura de `src/app/features/accounting/bank-accounts/` pero sin subcarpeta `components/` de formularios/confirmaciones (es solo lectura): `income-report-dashboard.ts/html/scss`.
   - Componente `IncomeReportDashboard`, standalone, imports: `ReactiveFormsModule`, `MatFormFieldModule`, `MatSelectModule`, `MatDatepickerModule`, `MatNativeDateModule`, `MatButtonModule`, `MatIconModule`, `MatTableModule`, `DecimalPipe`, `DatePipe`.
   - Inyecta `SPBankAccountHistory` (nuevo método `getIncome`) y `SPBankAccount` (para poblar el filtro de cuentas, `listen()` filtrando `state === 'ACTIVE'`, mismo patrón que `tab-external.ts`).

3. **Formulario de filtros**
   - `FormGroup` con:
     - `bank_account_ids: FormControl<string[]>` inicial `[]`.
     - `from: FormControl<Date | null>` inicial `null`.
     - `to: FormControl<Date | null>` inicial `null`.
   - Campo "Cuentas Bancarias": `<mat-select multiple formControlName="bank_account_ids">` con `<mat-option>` por cada cuenta activa (`{{ a.name }} {{ a.number ? '(' + a.number + ')' : '' }}`, mismo formato que `tab-external.html`). No hay patrón de `mat-select multiple` existente en el proyecto — es el primero, sigue la API estándar de Angular Material.
   - Campos "Desde" y "Hasta": dos `mat-form-field` con `matDatepicker`, mismo patrón que `service-order-form` (`return_date`).
   - Botón "Buscar" (`mat-flat-button color="primary"`) que dispara la consulta. Botón "Limpiar filtros" (`mat-stroked-button`) que resetea el formulario y vuelve a consultar sin filtros.
   - **No** consultes en cada `valueChanges` — solo al presionar "Buscar" (evita golpear la BD en cada tecla/selección), igual que el resto de dashboards del proyecto que usan un botón o `(input)` explícito, no un `effect` reactivo a la BD.

4. **Carga y estado**
   - Signals: `rows = signal<BankAccountHistory[]>([])`, `loading = signal(false)`.
   - Método `search()`: toma `filterForm.value`, convierte `from`/`to` (si existen) a `YYYY-MM-DD` con `date.toISOString().split('T')[0]` (mismo patrón que `service-order-form.onSave()` para `return_date`), llama a `historyService.getIncome(...)`, setea `rows` y `loading`. En error, snackbar "Error al cargar el reporte" y `loading.set(false)`.
   - Llama a `search()` en el constructor o `ngOnInit` para mostrar todos los ingresos sin filtrar al entrar a la página.
   - `computed(() => this.rows().reduce((acc, r) => acc + (r.amount ?? 0), 0))` para el total de ingresos filtrado, mostrado en un resumen sobre la tabla (mismo estilo `summary-row`/`summary-value` usado en `service-order-detail-modal.scss` — reutiliza esas clases si es práctico).

5. **Tabla de resultados**
   - `mat-table` de solo lectura (sin columna de acciones), columnas: Fecha (`created_at | date:'dd/MM/yyyy HH:mm'`), Cuenta Bancaria (`row.bank_account?.name ?? '—'`), Tipo (`row.transaction_type?.name ?? '—'`), Concepto (`row.concept ?? '—'`), Monto (`Bs. {{ row.amount | number:'1.2-2' }}`, clase `cell-amount`).
   - Fila vacía: "Sin ingresos registrados en el rango seleccionado." (mismo patrón `*matNoDataRow` que `service-order-dashboard.html`).

6. **Ruta**
   - En `src/app/app.routes.ts`, agrega bajo los children de `AdminLayout`, junto a las rutas de `cuentas/*`:
     ```typescript
     {
       path: 'cuentas/ingresos',
       loadComponent: () => import('./features/accounting/income-report/income-report-dashboard').then(m => m.IncomeReportDashboard),
     },
     ```

7. **Menú de navegación**
   - En `src/app/shared/components/nav-menu/nav-menu.ts`, dentro del módulo `title: 'Cuentas'`, agrega el ítem:
     ```typescript
     { label: 'Ingresos', icon: 'trending_up', route: '/dashboard/cuentas/ingresos' },
     ```

## Consideraciones

- No modifica la base de datos — es un reporte de solo lectura sobre `bank_account_histories`.
- No crea un reporte de "Egresos" (transaction_type = EXPENSE) — no fue solicitado; si se pide después, el mismo método `getIncome` puede generalizarse a `getByType(type, filters)` o duplicarse como `getExpenses`.
- No resuelve `transaction_reference` a un número de orden legible — es un campo de texto libre reutilizado por distintos tipos de transacción (ver [[bank-account-history-payments]]), fuera de alcance.
- Validación simple: si `to` es anterior a `from`, deshabilita el botón "Buscar" o muestra un error de validación en el form — no es crítico, pero evita una consulta con rango invertido que siempre devuelve vacío.
- No agregues `MatSort`/`MatPaginator` a menos que el volumen de datos lo justifique — el patrón simple de `service-order-dashboard` (tabla sin paginación) es suficiente para el alcance actual.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP directo (todo vía Supabase).
