Al registrar o editar un lote, permite seleccionar una cuenta bancaria para registrar la compra como un movimiento de `bank_account_histories` (tipo `'Compra lote de productos'`[EGRESO]) y descontar el saldo de esa cuenta. Al modificar el lote, reconcilia el movimiento existente en vez de duplicarlo.

Utiliza un razonamiento: adaptive thinking

## Contexto

`bank_transaction_types` ya tiene sembrado el registro `'Compra lote de productos'`[EGRESO] (`allow_deletion=false`, ver `tables.sql`/`migrate.sql`). El reporte de Egresos (`/expense-report`, ya implementado en `src/app/features/accounting/expense-report/`) va a mostrar estos movimientos automáticamente en cuanto existan filas — no requiere ningún cambio adicional.

**Lección aplicada de [[bank-account-history-payments]]:** la primera implementación de pagos de orden de servicio usó `forkJoin` de llamadas REST separadas para tocar 3 tablas y quedó desincronizada en producción cuando una llamada fallaba a mitad de camino. Este comando usa el mismo patrón que la corrigió: **RPCs de Postgres atómicas** (`SECURITY DEFINER`, `FOR UPDATE`), no `forkJoin` desde Angular, para todo lo que toque `bank_account_histories` + `bank_accounts` a la vez.

**Diseño elegido — RPCs pequeñas y enfocadas, no una RPC gigante que reemplace el CRUD de `batches`:**
El `INSERT`/`UPDATE`/`DELETE` de la tabla `batches` en sí **sigue haciéndose por REST normal** vía `SPBatch.add()/update()/delete()` (sin cambios). Se agregan 3 RPCs pequeñas que **solo** manejan el efecto financiero (inserción/ajuste/reversión en `bank_account_histories` + `bank_accounts`), parametrizadas por `batch_id` + los campos mínimos necesarios (`bank_account_id`, `cost`, `stock`, `code`) — no por todas las columnas de `batches`. Esto evita una RPC con 16 parámetros que haya que mantener sincronizada con el esquema de `batches`, y sigue el mismo principio que separó `register_service_order_payment` del CRUD de `service_orders`.

**Cálculo del monto:** `amount = cost * stock` (costo unitario × cantidad = costo total de la compra del lote). Si `cost` o `stock` son `null`/`0` y se seleccionó una cuenta bancaria, es un error de validación (no se puede registrar una compra de Bs. 0).

**Vínculo con el lote:** igual que en pagos de orden de servicio, `bank_account_histories.transaction_reference` guarda `batches.id` (texto libre, sin FK formal — ver [[bank-account-history-payments]]). Para encontrar el movimiento de un lote: `transaction_reference = batches.id` AND `transaction_type_id` = el id de `'Compra lote de productos'`.

## Pasos

### 1. SQL — columna `bank_account_id` en `batches` + 3 RPCs atómicas

Agrega esto a `src/docs/database/migrate.sql` (como `-- v20 —`), y sincroniza `tables.sql` (columna + RPCs junto a las demás funciones) y `delete_bd.sql` (3 `DROP FUNCTION`).

```sql
-- ============================================================
-- v20 — Inventory Module: bank_account_id en batches + RPCs
-- atomicas para la compra de lote (Compra lote de productos)
-- ============================================================
ALTER TABLE batches ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_batches_bank_account_id ON batches(bank_account_id);

-- Inserta el movimiento de egreso y descuenta el saldo. Se usa al crear un
-- lote con cuenta bancaria seleccionada, y tambien la reutiliza
-- reconcile_batch_purchase() cuando una edicion pasa de "sin cuenta" a
-- "con cuenta".
CREATE OR REPLACE FUNCTION apply_batch_purchase(
  p_batch_id        UUID,
  p_bank_account_id UUID,
  p_cost            NUMERIC,
  p_stock           NUMERIC,
  p_code            TEXT,
  p_user_id         UUID
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account bank_accounts%ROWTYPE;
  v_type_id UUID;
  v_amount  NUMERIC(10,2);
  v_history bank_account_histories%ROWTYPE;
BEGIN
  v_amount := COALESCE(p_cost, 0) * COALESCE(p_stock, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y el stock deben ser mayores a 0 para registrar la compra en la cuenta bancaria.';
  END IF;

  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Compra lote de productos' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el tipo de transaccion "Compra lote de productos".';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  UPDATE bank_accounts SET balance = COALESCE(balance, 0) - v_amount WHERE id = p_bank_account_id
    RETURNING balance INTO v_account.balance;

  INSERT INTO bank_account_histories (
    bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept
  ) VALUES (
    p_bank_account_id, p_user_id, v_type_id, v_amount, v_account.balance,
    p_batch_id::TEXT, 'Compra de lote' || CASE WHEN p_code IS NOT NULL AND p_code <> '' THEN ' ' || p_code ELSE '' END
  ) RETURNING * INTO v_history;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION apply_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Reconcilia el movimiento existente de un lote (si lo hay) contra el
-- estado actual del formulario tras una edicion. Cubre los 4 casos:
-- sin registro + sin cuenta (no-op), sin registro + nueva cuenta (crea),
-- con registro + cuenta removida (revierte y elimina), con registro +
-- cuenta igual o distinta (recalcula el monto y ajusta balances).
CREATE OR REPLACE FUNCTION reconcile_batch_purchase(
  p_batch_id        UUID,
  p_bank_account_id UUID,
  p_cost            NUMERIC,
  p_stock           NUMERIC,
  p_code            TEXT,
  p_user_id         UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing    bank_account_histories%ROWTYPE;
  v_type_id     UUID;
  v_amount      NUMERIC(10,2);
  v_old_account bank_accounts%ROWTYPE;
  v_new_account bank_accounts%ROWTYPE;
BEGIN
  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Compra lote de productos' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el tipo de transaccion "Compra lote de productos".';
  END IF;

  SELECT * INTO v_existing FROM bank_account_histories
    WHERE transaction_reference = p_batch_id::TEXT AND transaction_type_id = v_type_id
    FOR UPDATE;

  IF NOT FOUND AND p_bank_account_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT FOUND AND p_bank_account_id IS NOT NULL THEN
    PERFORM apply_batch_purchase(p_batch_id, p_bank_account_id, p_cost, p_stock, p_code, p_user_id);
    RETURN;
  END IF;

  IF FOUND AND p_bank_account_id IS NULL THEN
    -- v_existing.bank_account_id puede ser NULL si la cuenta original ya fue
    -- eliminada (ON DELETE SET NULL en bank_account_histories.bank_account_id):
    -- en ese caso no hay saldo que revertir, solo se limpia el registro.
    IF v_existing.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) WHERE id = v_existing.bank_account_id;
    END IF;
    DELETE FROM bank_account_histories WHERE id = v_existing.id;
    RETURN;
  END IF;

  -- Caso: habia un movimiento y sigue habiendo cuenta seleccionada (igual o
  -- distinta). Se valida explicitamente que la cuenta destino exista *antes*
  -- de tocar cualquier saldo (en vez de confiar solo en el FK de
  -- bank_account_histories.bank_account_id, que daria un error generico y
  -- dejaria ambiguo cual de las dos cuentas fallo).
  v_amount := COALESCE(p_cost, 0) * COALESCE(p_stock, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y el stock deben ser mayores a 0 para registrar la compra en la cuenta bancaria.';
  END IF;

  IF v_existing.bank_account_id IS NOT NULL AND v_existing.bank_account_id <> p_bank_account_id THEN
    -- Bloquea ambas cuentas (origen y destino) en una sola sentencia y en
    -- orden deterministico por id, para evitar deadlocks si otra
    -- reconciliacion concurrente intercambia las mismas dos cuentas en
    -- sentido opuesto (A<-B a la vez que B<-A).
    PERFORM 1 FROM bank_accounts WHERE id IN (v_existing.bank_account_id, p_bank_account_id) ORDER BY id FOR UPDATE;

    SELECT * INTO v_new_account FROM bank_accounts WHERE id = p_bank_account_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;

    -- v_old_account puede no encontrarse si la cuenta original ya fue
    -- eliminada (ON DELETE SET NULL); en ese caso no hay saldo previo que
    -- revertir, solo se aplica el nuevo egreso a la cuenta destino.
    SELECT * INTO v_old_account FROM bank_accounts WHERE id = v_existing.bank_account_id;
  ELSE
    SELECT * INTO v_new_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;
  END IF;

  IF v_existing.bank_account_id = p_bank_account_id THEN
    -- Misma cuenta: un solo movimiento neto. OJO CON EL SIGNO: esto es un
    -- EGRESO (registrarlo resta del balance), lo opuesto a un pago de orden
    -- de servicio (que es un INGRESO y suma). Revertir un egreso es SUMAR
    -- el monto anterior; aplicar el nuevo egreso es RESTAR el monto nuevo.
    -- Formula: balance + monto_anterior - monto_nuevo (NO al reves).
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) - v_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  ELSE
    -- Cuenta distinta: la cuenta anterior recupera su monto (si aun existe)
    -- y la cuenta destino descuenta el nuevo monto. Verifica al final que
    -- ambos saldos reflejen exactamente el delta esperado.
    IF v_old_account.id IS NOT NULL THEN
      UPDATE bank_accounts
        SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0)
        WHERE id = v_old_account.id
        RETURNING * INTO v_old_account;

      IF v_old_account.balance IS DISTINCT FROM NULL
         AND v_old_account.balance < 0
         AND COALESCE(v_existing.amount, 0) > 0 THEN
        -- No deberia ocurrir (solo estamos devolviendo dinero), pero se deja
        -- como comprobacion defensiva por si la cuenta ya estaba en un
        -- estado inconsistente antes de esta operacion.
        RAISE WARNING 'La cuenta % quedo con saldo negativo (%) tras revertir un egreso.', v_old_account.id, v_old_account.balance;
      END IF;
    END IF;

    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) - v_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  END IF;

  UPDATE bank_account_histories
    SET bank_account_id = p_bank_account_id,
        amount = v_amount,
        balance = v_new_account.balance,
        concept = 'Compra de lote' || CASE WHEN p_code IS NOT NULL AND p_code <> '' THEN ' ' || p_code ELSE '' END
    WHERE id = v_existing.id;
END;
$$;

REVOKE ALL ON FUNCTION reconcile_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reconcile_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Revierte el movimiento de un lote (si existe) antes de eliminarlo, para
-- no dejar un egreso huerfano sin lote asociado.
CREATE OR REPLACE FUNCTION reverse_batch_purchase(p_batch_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing bank_account_histories%ROWTYPE;
  v_type_id  UUID;
BEGIN
  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Compra lote de productos' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_existing FROM bank_account_histories
    WHERE transaction_reference = p_batch_id::TEXT AND transaction_type_id = v_type_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) WHERE id = v_existing.bank_account_id;
  DELETE FROM bank_account_histories WHERE id = v_existing.id;
END;
$$;

REVOKE ALL ON FUNCTION reverse_batch_purchase(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reverse_batch_purchase(UUID) TO anon, authenticated;
```

En `tables.sql`: agrega la columna `bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL` a la definición de `batches` (bloque `-- 9. batches`), el índice junto a los demás `idx_batches_*`, y las 3 funciones junto a las RPCs de `service_order_payment` ya existentes (mismo patrón v19).

En `delete_bd.sql`: agrega `DROP FUNCTION IF EXISTS apply_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) CASCADE;`, `DROP FUNCTION IF EXISTS reconcile_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) CASCADE;` y `DROP FUNCTION IF EXISTS reverse_batch_purchase(UUID) CASCADE;` junto a las demás funciones.

### 2. Modelo `Batch`

En `src/app/core/models/batch.model.ts`, agrega `bank_account_id?: string | null;`. No se necesitan más cambios: `SPBatch.add()`/`update()` ya pasan cualquier campo del objeto que no esté explícitamente excluido (`id`, `created_at`, `updated_at`) como parte del `payload`, así que `bank_account_id` se guarda automáticamente como columna normal.

### 3. Servicio de orquestación `sb-batch-purchase.ts`

Crea `src/app/core/services/supabase/sb-batch-purchase.ts`, clase `SPBatchPurchase` (mismo patrón que `sb-service-order-payment.ts`: su propio `SupabaseClient`, sin `forkJoin`, solo llamadas `.rpc(...)`):

```typescript
public apply(input: { batchId: string; bankAccountId: string; cost: number | null; stock: number | null; code: string | null; userId: string | null }): Observable<BankAccountHistory> {
  return from(this.supabase.rpc('apply_batch_purchase', {
    p_batch_id: input.batchId,
    p_bank_account_id: input.bankAccountId,
    p_cost: input.cost,
    p_stock: input.stock,
    p_code: input.code,
    p_user_id: input.userId,
  })).pipe(map(({ data, error }) => { if (error) throw new Error(error.message); return data as BankAccountHistory; }));
}

public reconcile(input: { batchId: string; bankAccountId: string | null; cost: number | null; stock: number | null; code: string | null; userId: string | null }): Observable<void> {
  return from(this.supabase.rpc('reconcile_batch_purchase', {
    p_batch_id: input.batchId,
    p_bank_account_id: input.bankAccountId,
    p_cost: input.cost,
    p_stock: input.stock,
    p_code: input.code,
    p_user_id: input.userId,
  })).pipe(map(({ error }) => { if (error) throw new Error(error.message); }));
}

public reverse(batchId: string): Observable<void> {
  return from(this.supabase.rpc('reverse_batch_purchase', { p_batch_id: batchId })).pipe(
    map(({ error }) => { if (error) throw new Error(error.message); }),
  );
}
```

### 4. Formulario `batch-form-modal.ts`/`.html` — campo Cuenta Bancaria

- Inyecta `SPBankAccount`, expón `allBankAccounts = toSignal(this.bankAccountService.listen(), { initialValue: [] })` filtrado `state === 'ACTIVE'` (mismo patrón que `tab-external.ts`).
- Agrega `bank_account_id: [null as string | null]` al `FormGroup`.
- En `ngOnInit`, si `data.batch`, precarga `bank_account_id: batch.bank_account_id ?? null`.
- En el template, agrega el campo justo debajo de "Costo de Compra" (mismo formato de opciones que `tab-external.html`: `<mat-option [value]="null">— Sin cuenta —</mat-option>` + `@for` de cuentas activas). Agrega un hint (`<mat-hint>`) tipo "Si seleccionas una cuenta, se registrará como egreso por Bs. {{ costo × stock }} y se descontará el saldo." — texto informativo, no crítico.
- En `onSave()`, agrega `bank_account_id: raw.bank_account_id || null` al objeto que se cierra con `dialogRef.close(...)`.
- Validación: si `bank_account_id` no es null y (`cost` es `null`/`0` o `stock` es `null`/`0`), no cierres el diálogo — marca los campos `cost`/`stock` como touched y muestra (por ejemplo con un `snackbar` inyectado, o un mensaje visible en el propio form) "Debe indicar costo y stock mayores a 0 para registrar la compra en la cuenta bancaria." Esto es una validación de UX que **replica** la que ya hace la RPC (defensa en profundidad, no reemplaza la del servidor).

### 5. Orquestación en `batch-dashboard.ts`

- Inyecta `SPBatchPurchase` y `AuthService`.
- **`openCreateModal()`**: tras `this.service.add(newBatch).subscribe(...)`, el resultado es `Batch[]` (ver `SPBatch.add`, usa `.select()` sin `.single()`) — toma `created = data[0]`. Si `newBatch.bank_account_id`, llama a `this.batchPurchaseService.apply({ batchId: created.id, bankAccountId: newBatch.bank_account_id, cost: created.cost, stock: created.stock, code: created.code, userId: this.auth.currentUser()?.id ?? null })`. En error, snackbar distinto: "Lote registrado, pero no se pudo registrar la compra en la cuenta bancaria" (el lote ya existe, no se revierte — mismo criterio de tolerancia que usa `service-order-form` entre crear la orden y guardar sus líneas).
- **`onEdit()`**: tras `this.service.update({ ...result, id: batch.id }).subscribe(...)`, llama **siempre** a `this.batchPurchaseService.reconcile({ batchId: batch.id, bankAccountId: result.bank_account_id ?? null, cost: result.cost, stock: result.stock, code: result.code, userId: this.auth.currentUser()?.id ?? null })` (la función RPC ya maneja el caso `bank_account_id: null` internamente). En error, snackbar "Lote actualizado, pero no se pudo ajustar el movimiento bancario".
- **`onDelete()`**: dentro de `ref.afterClosed().subscribe((confirmed) => ...)`, si `confirmed`, llama primero a `this.batchPurchaseService.reverse(batch.id)`, y **solo si tiene éxito** (en su `next`), llama a `this.service.delete(batch.id)`. Si `reverse` falla, no borres el lote — muestra un snackbar de error y detente (evita perder la trazabilidad del egreso sin haber revertido el saldo).

## Consideraciones

- **Verificación obligatoria de saldos al ejecutar este comando** — antes de dar por terminada la implementación, corre estos escenarios contra la base real (o con datos de prueba) y confirma los saldos esperados en `bank_accounts` y el registro único en `bank_account_histories` por lote:
  1. Crear lote con Cuenta A, costo 100, stock 2 (monto = 200) → A baja en 200; 1 fila en `bank_account_histories` con `bank_account_id=A, amount=200`.
  2. Editar el lote y cambiar a Cuenta B (mismo costo/stock) → A **recupera** los 200 (vuelve a su saldo original antes del paso 1); B baja en 200; la fila de `bank_account_histories` se actualiza (no se duplica) a `bank_account_id=B, amount=200`.
  3. Editar de nuevo el lote, misma Cuenta B, pero costo 150 (stock 2, monto = 300) → B baja **100 adicionales** respecto a su saldo tras el paso 2 (no sube). Ojo con el signo: es un EGRESO, revertir el monto anterior es sumarlo y aplicar el nuevo es restarlo (`balance + monto_anterior - monto_nuevo`), lo opuesto a la fórmula usada en `edit_service_order_payment` (que es un INGRESO). Si el saldo sube en vez de bajar tras este paso, el signo está invertido.
  4. Editar el lote y quitar la cuenta bancaria (`bank_account_id: null`) → B recupera los 300; la fila de `bank_account_histories` se elimina.
  5. Eliminar un lote que sí tiene cuenta bancaria asociada → la cuenta recupera el monto y la fila de `bank_account_histories` se elimina junto con el lote.
  - En todos los casos, `bank_account_histories` debe tener **como máximo una fila** por lote (`transaction_reference = batches.id` + tipo `'Compra lote de productos'`) — nunca se inserta una segunda fila para el mismo lote, siempre se reconcilia la existente.
- No modifiques `sb-batch.ts` — el CRUD de `batches` sigue siendo REST plano; solo el efecto financiero pasa por RPC.
- El reporte de Egresos (`/dashboard/cuentas/egresos`, ya implementado) mostrará estas compras automáticamente sin cambios adicionales, porque consulta todo `bank_account_histories` con `transaction_type.type = 'EXPENSE'`.
- No agregues una vista de "historial de compras por lote" tipo `service-order-payments-modal` — no fue solicitado. El campo `bank_account_id` en el propio lote y el reporte de Egresos ya cubren la trazabilidad.
- Si más adelante se necesita el mismo patrón para otro módulo (ej. servicios externos, que ya tiene `bank_account_id` en `service_order_external_services` pero sin esta lógica), replica esta misma estructura de 3 RPCs (`apply_*`, `reconcile_*`, `reverse_*`) en vez de generalizar prematuramente una RPC común — cada entidad tiene su propio cálculo de monto.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP directo (todo vía Supabase/RPC).
