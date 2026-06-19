Elimina el rol `MECHANIC` del enum UserRole en todo el sistema

Utiliza un razonamiento: adaptive thinking

## Contexto
El enum `UserRole` en la entidad `User` tiene los valores: `ADMIN`, `SALES`, `INVENTORY`, `MECHANIC`.
La tarea es eliminar el valor `MECHANIC` de este enum ya que los mecánicos se gestionan como entidad separada.

## Pasos

1. **Actualiza `entities.md`**
   - En `.claude/docs/entities.md`, elimina `MECHANIC` del enum `UserRole` de la entidad `User`.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/user.model.ts`, elimina `MECHANIC` del tipo `UserRole`.

3. **Actualiza el formulario de usuario**
   - En `src/app/features/admin/users/components/user-form-modal/`, elimina la opción `MECHANIC` del select/radio de roles.
   - Asegúrate de que si algún registro existente tiene rol `MECHANIC` no cause errores visuales (mostrar `MECHANIC` como texto plano si llega del backend).

4. **Actualiza las etiquetas de rol**
   - Busca con `grep -r "MECHANIC" src/` cualquier pipe, helper o switch que traduzca el enum a texto en español y elimina o comenta la entrada `MECHANIC`.

5. **Actualiza la base de datos**
   - En `src/docs/database/migrate.sql`: agrega una migración que elimine `MECHANIC` del tipo enum `user_role` en PostgreSQL/Supabase.
   - En `src/docs/database/tables.sql`: actualiza la definición del tipo enum para que no incluya `MECHANIC`.
   - En `src/docs/database/delete_bd.sql`: no se requiere cambio salvo que haya un enum que deba recrearse.

## Consideraciones
- Usa el mismo patrón de componentes de `src/app/features/admin/users/`.
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
- No elimines datos existentes del backend, solo la opción en el frontend.
