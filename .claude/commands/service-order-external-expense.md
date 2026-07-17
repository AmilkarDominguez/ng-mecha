La tabla `service_order_external_services` (Trabajos Adicionales / tab "Servicios Externos" del formulario de orden) ya tiene un select de Cuenta Bancaria en la UI (`tab-external.html`, campo `bank_account_id`) pero hoy es puramente decorativo — se guarda en la fila pero **no dispara ningún movimiento en `bank_account_histories` ni descuenta ningún saldo**. Este comando le agrega el efecto financiero real (tipo `'Pago servicio externo'`[EGRESO], ya sembrado en `bank_transaction_types`), incluyendo los escenarios de edición de la orden.

Utiliza un razonamiento: adaptive thinking

## Contexto

**Diferencia clave con `/batch-purchase-account` (ya implementado, ver [[bank-account-history-payments]] y `sb-batch-purchase.ts`):** un lote es una entidad estable con un `id` que persiste entre ediciones, así que ese comando usa un `reconcile_batch_purchase` que ajusta el registro existente in-place. Una orden de servicio **no** funciona así para sus líneas: `service-order-form.ts` sincroniza `service_order_external_services` (igual que `service_order_services` y `service_order_batches`) con la estrategia **delete-all + re-insert** ya documentada en `.claude/rules/service-order-flow.md` / `service-order-update.md` — en cada edición se llama `deleteLinesByOrderId(orderId)` y se vuelven a insertar todas las líneas desde cero, con **ids nuevos**. Intentar "reconciliar" por `id` de línea no funciona aquí porque el id nunca sobrevive a una edición.

**Diseño elegido, más simple que el de lotes — revertir todo + re-aplicar todo:** en vez de una RPC de reconciliación fina por línea, se usan 2 RPCs:
1. `apply_external_service_expense` — inserta el movimiento de egreso para **una** línea recién creada (se llama una vez por cada línea con `bank_account_id` seleccionado, tanto al crear la orden como al re-crear las líneas en una edición). Es el equivalente de `apply_batch_purchase`.
2. `reverse_external_service_expenses_for_order` — revierte **todos** los movimientos de egreso de servicios externos asociados a una orden (busca por `transaction_reference IN (ids de las líneas actuales de esa orden)`) y los elimina. Se llama **antes** de `deleteLinesByOrderId`, para poder encontrar las líneas viejas todavía existentes.

Esto evita por completo la clase de bug de signos que hubo que corregir en `reconcile_batch_purchase` (revertir vs. aplicar con la aritmética invertida): aquí nunca se calcula un delta combinado "monto anterior vs. monto nuevo" sobre la misma fila — siempre es una reversión limpia seguida de una aplicación limpia, exactamente igual de simple que `apply`/`reverse` de lotes por separado. Es menos "quirúrgico" (revierte y vuelve a aplicar incluso líneas que no cambiaron), pero es correcto por construcción y consistente con que la propia sincronización de líneas ya funciona así (delete-all + re-insert-all).

**Cálculo del monto:** `amount = cost * quantity` (mismo criterio que `cost * stock` en lotes — costo unitario × cantidad = lo que el taller le paga al servicio externo). `price` (lo que se cobra al cliente, ya incluido en `service_orders.total`) no se toca, es el lado de ingreso, no el de egreso.

**Vínculo:** `bank_account_histories.transaction_reference` = `service_order_external_services.id` (la línea, no la orden — necesario porque puede haber varias líneas con distintas cuentas bancarias en la misma orden).

## Pasos

### 1. SQL — 2 RPCs atómicas (sin columna nueva; `bank_account_id` ya existe en `service_order_external_services`)

Agrega esto a `src/docs/database/migrate.sql` (como `-- v21 —`), sincroniza `tables.sql` (junto a las RPCs de `service_order_payment`/`batch_purchase`) y `delete_bd.sql` (2 `DROP FUNCTION`).

```sql
-- ============================================================
-- v21 — Service Orders: RPCs atomicas para el egreso de
-- trabajos adicionales / servicios externos (Pago servicio externo)
-- ============================================================

-- Inserta el movimiento de egreso de UNA linea de service_order_external_services
-- y descuenta el saldo. Se llama una vez por cada linea con bank_account_id
-- seleccionado, tanto al crear la orden como al re-crear las lineas en una
-- edicion (ver reverse_external_service_expenses_for_order mas abajo).
CREATE OR REPLACE FUNCTION apply_external_service_expense(
  p_line_id         UUID,
  p_bank_account_id UUID,
  p_cost            NUMERIC,
  p_quantity        NUMERIC,
  p_concept         TEXT,
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
  v_amount := COALESCE(p_cost, 0) * COALESCE(p_quantity, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y la cantidad deben ser mayores a 0 para registrar el egreso en la cuenta bancaria.';
  END IF;

  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Pago servicio externo' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el tipo de transaccion "Pago servicio externo".';
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
    p_line_id::TEXT, p_concept
  ) RETURNING * INTO v_history;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION apply_external_service_expense(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_external_service_expense(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Revierte TODOS los movimientos de egreso de servicios externos de una
-- orden (busca por transaction_reference entre los ids de sus lineas
-- actuales) y los elimina. Debe llamarse ANTES de deleteLinesByOrderId,
-- mientras las lineas viejas todavia existen para poder encontrarlas.
CREATE OR REPLACE FUNCTION reverse_external_service_expenses_for_order(p_service_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_id UUID;
  v_row     RECORD;
BEGIN
  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Pago servicio externo' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RETURN;
  END IF;

  FOR v_row IN
    SELECT h.id AS history_id, h.bank_account_id, h.amount
    FROM bank_account_histories h
    WHERE h.transaction_type_id = v_type_id
      AND h.transaction_reference IN (
        SELECT id::TEXT FROM service_order_external_services WHERE service_order_id = p_service_order_id
      )
    FOR UPDATE OF h
  LOOP
    IF v_row.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_row.amount, 0) WHERE id = v_row.bank_account_id;
    END IF;
    DELETE FROM bank_account_histories WHERE id = v_row.history_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION reverse_external_service_expenses_for_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reverse_external_service_expenses_for_order(UUID) TO anon, authenticated;
```

### 2. Servicio de orquestación `sb-service-order-external-expense.ts`

Crea `src/app/core/services/supabase/sb-service-order-external-expense.ts`, clase `SPServiceOrderExternalExpense` (mismo patrón que `sb-batch-purchase.ts`: `SupabaseClient` propio, solo `.rpc(...)`, sin `forkJoin`):

```typescript
public apply(input: { lineId: string; bankAccountId: string; cost: number | null; quantity: number | null; concept: string; userId: string | null }): Observable<BankAccountHistory> {
  return from(this.supabase.rpc('apply_external_service_expense', {
    p_line_id: input.lineId,
    p_bank_account_id: input.bankAccountId,
    p_cost: input.cost,
    p_quantity: input.quantity,
    p_concept: input.concept,
    p_user_id: input.userId,
  })).pipe(map(({ data, error }) => { if (error) throw new Error(error.message); return data as BankAccountHistory; }));
}

public reverseForOrder(serviceOrderId: string): Observable<void> {
  return from(this.supabase.rpc('reverse_external_service_expenses_for_order', { p_service_order_id: serviceOrderId })).pipe(
    map(({ error }) => { if (error) throw new Error(error.message); }),
  );
}
```

### 3. `service-order-form.ts` — aplicar egresos tras guardar las líneas externas

`ServiceOrderForm` ya inyecta `AuthService` (agregado en `/service-order-registered-by`) — reutilízalo, no lo agregues de nuevo.

**3.1 — Inyecta el nuevo servicio:**
```typescript
private externalExpenseService = inject(SPServiceOrderExternalExpense);
```

**3.2 — Nuevo método privado, después de `saveLines`:**
```typescript
private applyExternalExpenses(rows: ServiceOrderExternalService[]): Observable<unknown> {
  const withAccount = rows.filter((r) => r.bank_account_id);
  if (withAccount.length === 0) return of(null);

  const originalRows = this.externalRows();
  const applies = withAccount.map((r) => {
    const original = originalRows.find((o) => o.external_service_id === r.external_service_id && o.bank_account_id === r.bank_account_id);
    const concept = 'Servicio externo' + (original?.external_service_name ? ' — ' + original.external_service_name : '');
    return this.externalExpenseService.apply({
      lineId: r.id,
      bankAccountId: r.bank_account_id!,
      cost: r.cost,
      quantity: r.quantity,
      concept,
      userId: this.auth.currentUser()?.id ?? null,
    }).pipe(
      catchError((err: unknown) => {
        this.snackBar.open(
          (err as Error)?.message ?? 'No se pudo registrar el egreso de un servicio externo',
          'Cerrar',
          { duration: 5000 },
        );
        return of(null);
      }),
    );
  });
  return forkJoin(applies);
}
```
(Requiere agregar `catchError` y `of` a los imports de `rxjs`/`rxjs/operators` si no están ya.)

La correlación por `external_service_id` + `bank_account_id` contra `this.externalRows()` es solo para armar un texto de concepto más legible (nombre del servicio externo) — es "best effort": si Supabase no devolviera las filas en el mismo orden o hubiera dos líneas idénticas, el monto y la cuenta bancaria de `r` (la fila real recién insertada) siguen siendo correctos de todas formas; en el peor caso el concepto queda genérico.

**3.3 — Modifica `saveLines` para encadenar `applyExternalExpenses` tras el bulk-insert de externos:**
```typescript
// Cambiar
if (externalToSave.length > 0)  saves.push(this.serviceOrderProvider.bulkAddExternalServices(externalToSave) as Observable<unknown>);
// Por
if (externalToSave.length > 0) {
  saves.push(
    this.serviceOrderProvider.bulkAddExternalServices(externalToSave).pipe(
      switchMap((created) => this.applyExternalExpenses(created)),
    ) as Observable<unknown>,
  );
}
```
(Requiere `switchMap` en los imports de `rxjs/operators`.)

**3.4 — Modifica `executeUpdate` para revertir los egresos existentes ANTES de `deleteLinesByOrderId`:**
```typescript
// Cambiar
private executeUpdate(orderId: string, payload: object): void {
  this.serviceOrderProvider.update({ id: orderId, ...payload } as ServiceOrder).subscribe({
    next: () => {
      this.serviceOrderProvider.deleteLinesByOrderId(orderId).subscribe({
        next: () => this.saveLines(orderId, 'Orden actualizada correctamente'),
        error: () => {
          this.snackBar.open('Error al sincronizar las líneas', 'Cerrar', { duration: 4000 });
        },
      });
    },
    error: () => {
      this.snackBar.open('Error al actualizar la orden', 'Cerrar', { duration: 4000 });
    },
  });
}

// Por
private executeUpdate(orderId: string, payload: object): void {
  this.serviceOrderProvider.update({ id: orderId, ...payload } as ServiceOrder).subscribe({
    next: () => {
      this.externalExpenseService.reverseForOrder(orderId).subscribe({
        next: () => {
          this.serviceOrderProvider.deleteLinesByOrderId(orderId).subscribe({
            next: () => this.saveLines(orderId, 'Orden actualizada correctamente'),
            error: () => {
              this.snackBar.open('Error al sincronizar las líneas', 'Cerrar', { duration: 4000 });
            },
          });
        },
        error: (err: unknown) => {
          this.snackBar.open(
            (err as Error)?.message ?? 'No se pudieron revertir los egresos de servicios externos; no se actualizó la orden.',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
    },
    error: () => {
      this.snackBar.open('Error al actualizar la orden', 'Cerrar', { duration: 4000 });
    },
  });
}
```
Nota el orden: si `reverseForOrder` falla, **no** se llega a `deleteLinesByOrderId` ni se tocan las líneas — la orden queda con sus líneas y movimientos bancarios anteriores intactos (falla de forma segura, no a medias).

**3.5 — `executeCreate` no necesita cambios** — no hay egresos previos que revertir en una orden nueva; `saveLines` ya aplica los egresos para las líneas recién creadas vía el cambio del paso 3.3.

### 4. `tab-external.ts`/`.html` — sin cambios

El campo Cuenta Bancaria ya existe y ya guarda `bank_account_id` en la fila. No hace falta tocar este componente.

## Consideraciones

- **Verificación obligatoria de saldos al ejecutar este comando** — antes de dar por terminada la implementación, corre estos escenarios y confirma los saldos esperados en `bank_accounts`:
  1. Crear una orden con 1 línea de servicio externo, Cuenta A, costo 50, cantidad 2 (monto = 100) → A baja en 100; 1 fila en `bank_account_histories` con `transaction_reference` = el id de esa línea.
  2. Editar la orden sin tocar la línea externa (mismo costo/cantidad/cuenta) → A **recupera** los 100 y luego vuelve a bajar 100 (por el revert-all + apply-all), así que el saldo final de A debe quedar igual al que tenía antes de editar. La línea externa se recreó con un `id` nuevo (delete-all + re-insert), así que la fila de `bank_account_histories` también es una fila nueva con `transaction_reference` = ese id nuevo — confirma que queda exactamente **una** fila en `bank_account_histories` para esta orden (la del paso 1 debe haber sido eliminada, no debe haber dos).
  3. Editar la orden y cambiar la línea externa a Cuenta B → A recupera los 100, B baja 100.
  4. Editar la orden y quitar la cuenta bancaria de la línea (`bank_account_id: null`) → B recupera los 100; no debe quedar ninguna fila en `bank_account_histories` para esta orden con el tipo `'Pago servicio externo'`.
  5. Orden con 2 líneas de servicios externos, cada una con una cuenta distinta → deben crearse 2 filas en `bank_account_histories`, cada cuenta descontada por su propio monto; al editar y quitar una de las dos líneas, solo la cuenta de la línea quitada recupera su saldo.
- No modifiques `tab-external.ts`/`.html`, `sb-service-order.ts` (`bulkAddExternalServices`/`deleteLinesByOrderId` ya sirven tal cual), ni el modelo `ServiceOrderExternalService` — `bank_account_id` ya existe ahí.
- No repliques el patrón de reconciliación fina de `/batch-purchase-account` — para líneas de orden de servicio, "revertir todo + re-aplicar todo" es más simple, más seguro (sin aritmética de deltas) y consistente con cómo el propio `deleteLinesByOrderId` + `bulkAdd*` ya sincroniza las líneas.
- El reporte de Egresos (`/dashboard/cuentas/egresos`) mostrará estos movimientos automáticamente sin cambios adicionales.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP directo (todo vía Supabase/RPC).
