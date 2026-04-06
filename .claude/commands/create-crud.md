Crea un nuevo CRUD para la entidad `$ARGUMENTS`

utiliza un razonamiento: adaptive thinking

toma como ejemplo el CRUD de rancher
Con la siguientes consideraciones
1. Todos los componentes, class de estilo y variables deben estar en ingles, solo los labels y registros en ES.
2. Ruta base para todo el CRUD en `src/app/features/dashboard/$ARGUMENTS/`.
2. Utliza las propiedades que se espesifican en `docs/entities.md` y agrega la interfaz en `src/app/core/models/` y realiza los ajustes en otras solo si fuera necesario y estan relacionadas
3. El CRUD debe constar los siguientes componentes empleando componentes base de angular material, en modo standalone.
   - dashboard : componente que contiene.
     - Tabla que es otro sub componente con las columnas mas relevantes, para mostrar todos los registros que incluya paginacion, ordenamiento y una columna extra con las siguientes opciones:
       - Boton para editar, que despliega el mismo modal que funciona para agregar y editar.
       - Boton ver para mostrar un modal para mostrar la informacion del registro.
       - Boton eliminar que muestra un dialogo de confirmacion para eliminar el registro.
     - Caja de busqueda para filtrar los registros.
     - Boton para agregar un nuevo registro, un boton notorio en la parte superior que permite desplegar un modal para agregar un nuevo registro
   - modal para crear o editar : componente que se presenta como modal con el boton del dashboard que permite registrar o editar mediante un fomulario con las validaciones correspondientes y los labels en ES.
   - modal informativo : compoente que se presenta como modal con el boton de mostrar de ver en la tabla que muestra toda la informacion del registro que no se muestra en las columnas de la tabla, esta vista debe tener un boton para poder imprimir la informacion.
4. Ajustar el menu de navegacion para coincidir con modulos y categorias
5. La ruta lazy en `app.routes.ts` bajo AdminLayout 
6. Un archivo `$ARGUMENTS.mock.ts` con data estatica representativa con el contexto de un taller mecanico

Realiza los ajutes necesarios si es pertinente en otros componentes compatidos en `src/app/shared/components/`, directivas en  `src/app/shared/directives/` y pipes en `src/app/shared/pipes/`

Comprueba que todo esta funcionando correntamente con las versiones de angular 21

Sigue las convenciones del CLAUDE.md: signals, sin HTTP, Angular Material.

Estos datos deben estar en el modulo de Inventario
