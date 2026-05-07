modifica el feature de `$ARGUMENTS`

1. Analiza los cambios en `.claude\docs\entities.md`
2. Analiza el modelo actualiza el modelo en `src\app\core\models` si es necesario
3. Analiza los servicios en `src\app\core\services` y actualiza los servicios que esta relacionados con la entidad $ARGUMENTS
4. Analiza y actualiza los componentes del feature en `src\app\features`
5. Analiza y actualiza la base de datos `src\docs\database` tanto para eliminar con `src\docs\database\delete_bd.sql` para las migraciones `src\docs\database\migrate.sql` y creacion de las tablas `src\docs\database\tables.sql`
