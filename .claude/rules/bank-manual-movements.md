# Registro manual de Ingresos y Egresos (Cuentas → Registrar Ingreso / Registrar Egreso)

Regla de referencia para los módulos **Registrar Ingreso** (`accounting/income-register/`,
2026-07-23) y **Registrar Egreso** (`accounting/expense-register/`, 2026-07-23) — dos módulos
gemelos, mismo diseño espejado (uno suma al balance, el otro resta). Documenta por qué existen
junto a los reportes ya existentes, y el invariante de seguridad que no debe romperse: nunca
permitir editar/eliminar desde aquí un movimiento que pertenece a otro flujo.

Documentos relacionados:
- `.claude/commands/income-report.md` / `.claude/commands/expense-report.md` — los reportes de
  solo lectura ya existentes (`accounting/income-report/`, `accounting/expense-report/`), que
  siguen mostrando TODOS los movimientos (manuales + automáticos).
- `[[service-order-flow]]` §9 — pagos de orden de servicio (INCOME) y egresos de servicios
  externos (EXPENSE), los otros flujos que insertan filas en `bank_account_histories`.
- `[[features-navigation]]` §2 — ubicación en el menú (grupo "Cuentas").

---

## 1. Por qué son módulos separados de los reportes

Antes de esta implementación, `bank_transaction_types` ya tenía sembrados **"Depósito a
cuenta bancaria"** (`INCOME`) y **"Retiro de cuenta bancaria"** (`EXPENSE`), ambos con
`allow_deletion: false`, pero **ninguno se usaba**: no existía ningún flujo (UI ni RPC) que
registrara un movimiento manual. Los únicos movimientos que se insertaban en la práctica eran:

- `INCOME` → **"Pago de orden de servicio"** (`[[service-order-flow]]` §9, RPCs
  `register/edit/delete_service_order_payment`).
- `EXPENSE` → **"Compra lote de productos"** (`apply_batch_purchase`) y **"Pago servicio
  externo"** (`apply_external_service_expense`).

`income-report-dashboard` y `expense-report-dashboard` siguen siendo **puramente de lectura**
— no se les agregaron botones de registrar/editar/eliminar. La razón: esas tablas mezclan
movimientos de distintos orígenes, y permitir editar/eliminar cualquier fila desde ahí habría
requerido la misma lógica de "esto pertenece a otro proceso" que ya vive en las RPCs nuevas —
se prefirió un módulo separado y explícito por cada dirección (ingreso/egreso) en vez de
sobrecargar los reportes con reglas condicionales.

## 2. Esquema — cómo se distingue "manual" de "automático"

`bank_account_histories` no tiene una columna que diga "este movimiento es manual". La
distinción es por convención: **`transaction_reference IS NULL`** = movimiento manual (sin
entidad relacionada). Los flujos automáticos siempre insertan una referencia
(`service_orders.id`, el id de la línea de servicio externo, etc.); los movimientos de estos
dos módulos siempre insertan `NULL`.

**Invariante crítico:** `edit_bank_income`/`delete_bank_income` y
`edit_bank_expense`/`delete_bank_expense` verifican `transaction_reference IS NOT NULL` y
**abortan con excepción** si el movimiento no es manual (`'Este movimiento pertenece a otro
proceso y no se puede editar/eliminar desde aquí.'`). Esto es defensa en profundidad — la UI
de estos módulos solo lista filas con `transaction_reference IS NULL`
(`SPBankIncome.list()`/`SPBankExpense.list()`, filtro `.is('transaction_reference', null)`),
así que en el flujo normal nunca se intenta editar/eliminar una fila ajena, pero la RPC lo
bloquea también a nivel de base de datos. **Si tocas estas RPCs, no quites esta validación** —
es lo único que impide que estos módulos desincronicen `service_orders.have`/`must` (u otro
estado dependiente) al editar/eliminar por error un movimiento de otro flujo.

## 3. RPCs (`src/docs/database/migrate.sql` v24 Ingresos / v25 Egresos, replicadas en `tables.sql`)

Ambas parejas de RPCs son un espejo exacto salvo el signo del ajuste de balance:

| RPC | Ingreso (v24) | Egreso (v25) | Nota |
|---|---|---|---|
| Registrar | `register_bank_income(p_bank_account_id, p_transaction_type_id, p_amount, p_concept, p_user_id)` | `register_bank_expense(...)` (misma firma) | Valida `p_amount > 0` y que el tipo exista con `type = 'INCOME'`/`'EXPENSE'` respectivamente. Inserta con `transaction_reference = NULL`. Ingreso: `balance += amount`. Egreso: `balance -= amount` (**sin validar fondos suficientes** — mismo criterio que `apply_batch_purchase`/`apply_external_service_expense`, que tampoco lo validan; el balance puede quedar negativo). |
| Editar | `edit_bank_income(p_history_id, p_bank_account_id, p_transaction_type_id, p_amount, p_concept)` | `edit_bank_expense(...)` (misma firma) | Guard de `transaction_reference` (ver §2). Soporta mover el movimiento a otra cuenta bancaria (bloquea ambas cuentas en orden determinístico por `id`, mismo patrón anti-deadlock que `edit_service_order_payment`). |
| Eliminar | `delete_bank_income(p_history_id)` | `delete_bank_expense(p_history_id)` | Guard de `transaction_reference` (ver §2). Revierte el balance de la cuenta antes de borrar la fila (ingreso: resta lo que se había sumado; egreso: suma lo que se había restado). |

Todas `SECURITY DEFINER`, `FOR UPDATE` en las filas que tocan, `REVOKE ALL ... FROM PUBLIC` +
`GRANT EXECUTE ... TO anon, authenticated` — mismo patrón que el resto de RPCs financieras del
proyecto (nunca cálculo de balances en el cliente, nunca llamadas REST encadenadas).

## 4. Servicios Angular — `SPBankIncome` / `SPBankExpense`

`sb-bank-income.ts` y `sb-bank-expense.ts` (`core/services/supabase/`) son estructuralmente
idénticos:

- `list()` / `listen()` — `bank_account_histories` con join a `bank_accounts` y
  `bank_transaction_types` (`!inner`), filtrado por `transaction_reference IS NULL` y
  `transaction_type.type = 'INCOME'`/`'EXPENSE'` respectivamente.
- `incomeTransactionTypes()` / `expenseTransactionTypes()` — filtran `bank_transaction_types`
  (`ACTIVE` + el `type` correspondiente) **excluyendo** los tipos reservados a flujos
  automáticos:
  - `RESERVED_INCOME_TYPE_NAMES = ['Pago de orden de servicio', 'Creación de cuenta bancaria']`
  - `RESERVED_EXPENSE_TYPE_NAMES = ['Compra lote de productos', 'Pago servicio externo']`

  No se ofrecen en el `mat-select` de estos módulos para no invitar a un uso confuso (aunque la
  RPC no los bloquea a nivel de nombre, solo por `type`). **Si agregas un tipo de transacción
  nuevo pensado para otro flujo automático futuro, agrégalo a la lista reservada
  correspondiente** — de lo contrario aparecerá como opción manual aquí por error.
- `register()` / `edit()` / `remove()` — wrappers delgados de las RPCs de §3, mismo estilo que
  `SPServiceOrderPayment`.

## 5. UI

Ambos módulos (`income-register-dashboard` / `expense-register-dashboard`) siguen el mismo
esqueleto:

- CRUD estándar (dashboard + tabla + búsqueda + botón "Registrar Ingreso"/"Registrar Egreso"),
  patrón de `bank-account-dashboard` **sin** modal de "ver detalle" (los datos ya son visibles
  en las columnas de la tabla: fecha, cuenta, tipo, concepto, monto).
- `*-form-modal` — formulario único para crear/editar (cuenta bancaria, tipo, monto, concepto).
  `DialogFrame`, patrón `floating-dialog-panel` estándar.
- `*-delete-confirm-modal` — confirmación simple (no usa `DialogFrame`, mismo criterio que
  `BankAccountDeleteConfirmModal`).
- `user_id` en el registro creado viene de `AuthService.currentUser()?.id` (mismo patrón que
  `service-order-registered-by`), pero **no se muestra "registrado por" en la UI** — a
  diferencia de `ServiceOrderDetailModal`, no se consideró necesario para estos módulos.
- Diferencia visual menor: la columna/total de monto usa `var(--mat-sys-primary)` en Ingresos y
  `var(--mat-sys-error)` en Egresos — señal visual rápida de la dirección del movimiento, sin
  significar ningún estado de error.

## 6. Checklist antes de tocar estos módulos

1. ¿Vas a permitir editar/eliminar un `bank_account_history` desde otro lugar del sistema? →
   respeta el mismo criterio de `transaction_reference IS NULL` antes de exponer esa acción, o
   usa una RPC dedicada con su propio guard — nunca actualices/borres esa tabla con REST plano
   (`SPBankAccountHistory.update()`/`.delete()` existen pero están **sin usar** en todo el
   proyecto a propósito; no los conectes a una UI sin agregar el mismo tipo de guard atómico).
2. ¿Vas a agregar un tipo de transacción INCOME o EXPENSE nuevo con su propio flujo automático
   (ej. otro proceso que inserte movimientos)? → agrégalo a `RESERVED_INCOME_TYPE_NAMES` o
   `RESERVED_EXPENSE_TYPE_NAMES` en el servicio correspondiente para que no aparezca como
   opción manual aquí.
3. ¿Vas a modificar `income-report-dashboard`/`expense-report-dashboard`? → siguen siendo de
   solo lectura a propósito (ver §1); si necesitas acciones ahí, coordina con este documento
   primero.
4. ¿Vas a agregar validación de fondos suficientes al egreso? → hoy no existe (§3, a propósito
   para mantener consistencia con `apply_batch_purchase`/`apply_external_service_expense`); si
   se agrega, aplícalo también a esas dos RPCs para no dejar una inconsistencia entre flujos.
