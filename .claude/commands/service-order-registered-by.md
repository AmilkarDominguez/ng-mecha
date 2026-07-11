Guarda el usuario de la sesión activa al registrar una orden de servicio y lo muestra en el detalle.

Utiliza un razonamiento: adaptive thinking

## Contexto

La entidad `ServiceOrder` ya tiene el campo `user_id` (FK nullable → `users.id`) tanto en la tabla `service_orders` como en el modelo TypeScript — **no hace falta tocar la base de datos ni el modelo `service-order.model.ts` para este campo**. El problema es que hoy nunca se asigna: en `service-order-form.ts`, dentro de `onSave()`, el payload manda `user_id: null` siempre (línea del `payload`), tanto al crear como al editar. Tampoco se muestra en ningún lugar de la UI.

La sesión activa vive en `AuthService` (`src/app/core/auth/services/auth.service.ts`), con el signal `currentUser` (`PublicUser | null`, con `.id`, `.name`, `.lastname`). Ya se usa este mismo servicio en `service-order-payments-modal.ts` (`this.auth.currentUser()?.id ?? null`) — sigue ese mismo patrón de inyección.

**Regla de negocio importante:** `user_id` debe guardarse **solo al crear** la orden (el usuario que la registró originalmente). Al editar una orden existente, `user_id` **no debe sobrescribirse** con el usuario que está editando — debe conservar el valor original. Verifica esto con cuidado: hoy el mismo objeto `payload` de `onSave()` se reutiliza para `executeCreate` y `executeUpdate`, así que si simplemente se pone el usuario actual en el payload compartido, cada edición reasignaría `user_id` al editor de turno, lo cual es incorrecto.

## Pasos

1. **Inyecta `AuthService` en `ServiceOrderForm`**
   - En `src/app/features/service-order/service-order-form/service-order-form.ts`, agrega el import `import { AuthService } from '../../../core/auth/services/auth.service';` y `private auth = inject(AuthService);`.

2. **Preserva el `user_id` original en modo edición**
   - Agrega un signal `readonly originalUserId = signal<string | null>(null);`.
   - En `ngOnInit()`, dentro del bloque que carga la orden con `getWithLines(id)` (modo edición), agrega `this.originalUserId.set(order.user_id);`.

3. **Corrige el payload en `onSave()`**
   - Reemplaza la línea `user_id: null,` del `payload` por:
     ```typescript
     user_id: this.isEditMode() ? this.originalUserId() : (this.auth.currentUser()?.id ?? null),
     ```
   - Esto asegura: al crear, se guarda el usuario de la sesión activa; al editar, se conserva el `user_id` original cargado en el paso 2.

4. **Amplía el join en `getWithLines` para traer los datos del usuario**
   - En `src/app/core/services/supabase/sb-service-order.ts`, en el método `getWithLines`, en el `select` de `order` dentro del `forkJoin`, agrega el join a `users`:
     ```typescript
     // Cambiar
     .select('*, customer:customers(id,name,lastname,ci,phone), vehicle:vehicles(id,license_plate,brand,model,year), mechanic:mechanics(id,name,lastname)')
     // Por
     .select('*, customer:customers(id,name,lastname,ci,phone), vehicle:vehicles(id,license_plate,brand,model,year), mechanic:mechanics(id,name,lastname), user:users(id,name,lastname)')
     ```

5. **Agrega el campo `user` a `ServiceOrderWithLines`**
   - En `src/app/core/models/service-order.model.ts`, en la interfaz `ServiceOrderWithLines`, junto a `mechanic`, agrega:
     ```typescript
     user: { id: string; name: string | null; lastname: string | null } | null;
     ```

6. **Muestra el usuario en el modal de detalle**
   - En `src/app/features/service-order/components/service-order-detail-modal/service-order-detail-modal.ts`, agrega un helper análogo a `mechanicLabel`:
     ```typescript
     userLabel(d: ServiceOrderWithLines): string {
       const u = d.user;
       if (!u) return 'Sistema';
       return [u.name, u.lastname].filter(Boolean).join(' ') || '—';
     }
     ```
   - En `service-order-detail-modal.html`, agrega un `detail-section` con label "Registrado por" mostrando `{{ userLabel(d) }}`. Ubícalo junto al bloque `Registrado` (fecha de creación, dentro de `detail-columns detail-columns--four`) para que quede junto a la fecha de registro.

## Consideraciones

- No modifiques `src/docs/database/{tables.sql,migrate.sql,delete_bd.sql}` — la columna `user_id` en `service_orders` ya existe desde la creación del módulo, no requiere migración.
- No modifiques el join de `get()` (usado por el dashboard/listado) ni de `getById()` a menos que también quieras mostrar el usuario ahí — no fue pedido, es opcional.
- Si `currentUser()` es `null` (no debería pasar en una ruta protegida, pero el `authGuard` está desactivado en la fase actual de mockup), el `user_id` queda `null` y el detalle debe mostrar "Sistema" en vez de fallar — ya contemplado en `userLabel`.
- Toma como referencia el mismo patrón ya usado para `mechanic` (`mechanicLabel`, join `mechanic:mechanics(id,name,lastname)`) tanto en el servicio como en el modal de detalle.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
