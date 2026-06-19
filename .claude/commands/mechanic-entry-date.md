Agrega la fecha de ingreso al módulo de Mecánicos

Utiliza un razonamiento: adaptive thinking

## Contexto
La entidad `Mechanic` necesita un nuevo campo `entry_date` (fecha de ingreso) que registra cuándo el mecánico comenzó a trabajar en el taller.
El campo es opcional y de tipo fecha.

## Pasos

1. **Actualiza `entities.md`**
   - En `.claude/docs/entities.md`, agrega el campo `entry_date | LocalDate | nullable` a la tabla `mechanics`.

2. **Actualiza el modelo TypeScript**
   - En `src/app/core/models/mechanic.model.ts`, agrega `entry_date?: string | null` a la interfaz `Mechanic`.

3. **Actualiza el formulario de mecánico**
   - En `src/app/features/workshop/mechanics/components/mechanic-form-modal/`, agrega un `MatFormField` con `matDatepicker` para el campo `entry_date`.
   - Label en español: "Fecha de Ingreso".
   - El campo es opcional.
   - Importa `MatDatepickerModule` y `MatNativeDateModule` si no están ya importados.
   - Agrega el `FormControl<Date | null>` al `FormGroup` existente.
   - Al guardar, convierte la fecha a string ISO `YYYY-MM-DD` antes de enviar al servicio.

4. **Actualiza el modal de detalles del mecánico**
   - En `src/app/features/workshop/mechanics/components/mechanic-detail-modal/`, muestra el campo `entry_date`.
   - Label: "Fecha de Ingreso".
   - Formatea la fecha con `DatePipe` o un pipe existente del proyecto.
   - Si está vacío, mostrar "Sin fecha registrada".

5. **Actualiza la tabla de mecánicos** (opcional)
   - En `src/app/features/workshop/mechanics/components/mechanic-table/`, considera agregar la columna "Fecha de Ingreso" si hay espacio en la tabla.

6. **Actualiza el servicio Supabase**
   - En `src/app/core/services/supabase/sb-mechanic.ts`, verifica que `add` y `update` incluyan el campo `entry_date` en el payload.

7. **Actualiza la base de datos**
   - En `src/docs/database/migrate.sql`: agrega `ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS entry_date DATE;`
   - En `src/docs/database/tables.sql`: agrega la columna `entry_date DATE` en la definición de la tabla `mechanics`.

## Consideraciones
- Toma como referencia el componente existente en `src/app/features/workshop/mechanics/`.
- El datepicker debe seguir el mismo estilo que otros formularios de fecha del proyecto (ver `service-order-form` o `vehicle-form-modal`).
- Sigue las convenciones del CLAUDE.md: signals, Angular Material, sin HTTP.
