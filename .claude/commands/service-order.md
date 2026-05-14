Utiliza un razonamiento: adaptive thinking

Crear el registro ordenes de servicio, para registrar las ordenes de servicio se require mostrar datos de varias entidades que se detallan a continuacion:


# Service Orders Module

---

## 1. ServiceOrder

**Tabla:** `service_orders`

| Columna               | Tipo               | Restricciones           |
| --------------------- | ------------------ | ----------------------- |
| id                    | UUID               | PK, auto-generated      |
| customer_id           | UUID (FK)          | not null → customers.id |
| vehicle_id            | UUID (FK)          | nullable → vehicles.id  |
| user_id               | UUID (FK)          | nullable → users.id     |
| number                | String             | nullable                |
| description           | String             | nullable                |
| total                 | BigDecimal(8,2)    | nullable                |
| have                  | BigDecimal(8,2)    | nullable, default: 0    |
| must                  | BigDecimal(8,2)    | nullable                |
| iva                   | BigDecimal(8,2)    | nullable                |
| total_iva             | BigDecimal(8,2)    | nullable                |
| with_iva              | Boolean            | default: false          |
| mileage               | String             | nullable                |
| draft_expiration_date | LocalDate          | nullable                |
| started_date          | LocalDate          | nullable                |
| ended_date            | LocalDate          | nullable                |
| return_date           | LocalDate          | nullable                |
| state                 | OrderState (enum)  | default: IN_PROGRESS    |
| payment_type          | PaymentType (enum) | default: CASH           |
| created_at            | LocalDateTime      | auto                    |
| updated_at            | LocalDateTime      | auto                    |

**Enum OrderState:** `IN_PROGRESS` (EN_CURSO) · `COMPLETED` (COMPLETADO) · `CANCELED` (CANCELADO)
**Enum PaymentType:** `CASH` (CONTADO) · `CREDIT` (CREDITO)


---

## 2. ServiceOrderBatch

**Tabla:** `service_order_batches`

| Columna          | Tipo                | Restricciones                |
| ---------------- | ------------------- | ---------------------------- |
| id               | UUID                | PK, auto-generated           |
| batch_id         | UUID (FK)           | nullable → batches.id        |
| service_order_id | UUID (FK)           | nullable → service_orders.id |
| quantity         | BigDecimal          | nullable                     |
| delivery_time    | DeliveryTime (enum) | default: IMMEDIATE           |
| price            | BigDecimal(8,2)     | nullable                     |
| discount         | BigDecimal(8,2)     | nullable                     |
| subtotal         | BigDecimal(8,2)     | nullable                     |
| created_at       | LocalDateTime       | auto                         |
| updated_at       | LocalDateTime       | auto                         |

**Enum DeliveryTime:** `ORDER` (PEDIDO) · `IMMEDIATE` (INMEDIATO)
---

## 3. ServiceOrderService

**Tabla:** `service_order_services`

| Columna          | Tipo            | Restricciones                |
| ---------------- | --------------- | ---------------------------- |
| id               | UUID            | PK, auto-generated           |
| mechanic_id      | UUID (FK)       | nullable → mechanics.id      |
| service_id       | UUID (FK)       | nullable → services.id       |
| service_order_id | UUID (FK)       | nullable → service_orders.id |
| discount         | BigDecimal(8,2) | nullable                     |
| price            | BigDecimal(8,2) | nullable                     |
| quantity         | BigDecimal      | nullable                     |
| subtotal         | BigDecimal(8,2) | nullable                     |
| created_at       | LocalDateTime   | auto                         |
| updated_at       | LocalDateTime   | auto                         |

---

## 4. ServiceOrderExternalService

**Tabla:** `service_order_external_services`

| Columna                 | Tipo            | Restricciones                      |
| ----------------------- | --------------- | ---------------------------------- |
| id                      | UUID            | PK, auto-generated                 |
| external_service_id     | UUID (FK)       | nullable → external_services.id    |
| service_order_id        | UUID (FK)       | nullable → service_orders.id       |
| bank_account_id         | UUID (FK)       | nullable → bank_accounts.id        |
| cost                    | BigDecimal(8,2) | nullable                           |
| price                   | BigDecimal(8,2) | nullable                           |
| quantity                | BigDecimal      | nullable                           |
| subtotal                | BigDecimal(8,2) | nullable                           |
| created_at              | LocalDateTime   | auto                               |
| updated_at              | LocalDateTime   | auto                               |

---


Una orden de servicio consta de 4 relaciones principales para lo cual es necesario dividir cada seccion empleando tabs mediante un panel central de registro, empleando el componente de angular material `mat-tab-group`

El contenido de cada tab y las tablas deben ser componentes separados, pensados en su reutilizacion para el apartado de actualizacion de una orden de servicio y otros modulos futuros, todo esto debe pertenecer al feature en `src/app/features/service-order/` y crea los componentes necesarios. 

## Tabs

1. TAB 1 : Cliente
  - En esta seccion esta relacionada al cliente, vehiculo y datos de la entidad orden de servicio, se debe poder buscar un cliente mediante un select con autocompletado similar al formulario de registro de vehiculos en `src\app\features\workshop\vehicles\components\vehicle-form-modal`, tras seleccionar un cliente se debe mostrar la informacion del cliente seleccionado con informacion relevante sin considerar mostrar la calificacion.
  - Tras seleccionar un cliente se debe listar todos los vehiculos del cliente seleccionado en otro select con autocompletado, para poder seleccionarlo y tambien mostrar la informacion relevante.
  - El tab 1 tambien debe contener los siguientes inputs que estan relacionados con la entidad orden de servicio:
    - Numero : service_orders.number, es el codigo que ayuda a identificar la orden de servicio
    - Kilometrage: service_orders.mileage, el kilometrage que indica el vehiculo seleccionado al momento de realizar una orden de servicio.
    - Fecha de Ingreso: service_orders.started_date, fecha de ingreso del vehiculo para la orden de servicio
    - Fecha de Salida: service_orders.ended_date, fecha de salida del vehiculo tras el mantenimiento
2. TAB 2: Mano de Obra
  - En esta seccion esta relacionada a la relacion entre la entidad service, mechanic, service_order y service_order_services como tabla pibote, una orden de servicio puede contener varios servicios realizados por diferentes mecanicos.
  - Se debe poder seleccionar un servicio entidad `service` mediante un select con autucompletado para poder buscar un servicio que ofrece el taller de la entidad services pero se debe mostrar solo los servicios con el state: active.
  - Se debe poder seleccionar un tecnico entidad `mechanic` mediante un select con autocompletado para poder buscar un tecnico mecanico registrado en el sistema con la propiedad state:active.
  - Ademas se debe contar con los siguientes inputs:
    - Precio: aqui se debe mostrar el precio base que esta registrado en la entidad `service` y se debe habilitar y actualizar tras que el usuario seleccione un servicio.
    - Cantidad: input numerico que solo acepta numeros enteros positivos que empiezan en 1, se habilita tras la seleccion del servicio y el usuario puede cambiar la cantidad de servicios, generalmente es solo 1 pero existen casos especiales.
    - Boton para Agregar:
      - Este boton permite agregar toda una entidad de tipo `service_order_services` creada a partir de los datos seleccionados en el segundo tab, el objetivo de registrar esta entidad es que se pueda mostrar los registros en una tabla de detalles que esta fuera de los tabs en la misma pagina de registro de orden servicio, misma que esta detallada en otro punto en este mismo archivo  service_order_services_table
3. TAB 3: Repuestos e insumos
  - En esta seccion esta relacionada a la relacion entre la entidad `batches`,`service_order` y `service_order_batches` como tabla pibote, una orden de servicio puede contener varios lotes `batches` relacionados.
  - Se debe poder seleccionar un lote de entidad `batches` mediante un input que funciona como search con autucompletado para poder buscar un lote mediante el nombre del producto `batches.product->name`, description del lote `batches.description`, marcas compatibles `batches.compatible_brands` y modelos compatibles `batches.compatible_models` que ofrece el taller de la entidad `batches` pero se debe mostrar solo los lotes con el state: active, el buscador mostrara un pequeno listado de resultado que debe incluir un boton para poder seleccionar el un lote, el objetivo de mostrar un listado es que el usuario pueda ver la informacion relevante del lote, como el stok y precio de venta, almacen, codigo, marca.
  - Tras seleccionar un lote se debe mostrar toda la informacion relevante del lote y ocultar la informacion de busqueda y limpiar el buscador.
  - Boton para Agregar:
    - Este boton permite agregar toda una entidad de tipo `service_order_batches` creada a partir de los datos seleccionados en el tercer tab, el objetivo de registrar esta entidad es que se pueda mostrar los registros en una tabla de detalles que esta fuera de los tabs en la misma pagina de registro de orden servicio, misma que esta detallada en otro punto en este mismo archivo service_order_batches_table  
4. TAB 4: Trabajos adicionales
  - En esta seccion esta relacionada a la relacion entre la entidad `external_service`,`service_order` y `service_order_external_services` como tabla pibote, una orden de servicio puede contener varios servicios externos relacionados.
  - Se debe poder seleccionar un servicio externo entidad `external_service` mediante un select con autucompletado para poder buscar un servicio externo mediante el nombre que ofrece el taller pero se debe mostrar solo los servicios externos con el state: active
  - Ademas se debe contar con los siguientes inputs que se habilitan tras seleccionar un servicio externo:
      - Costo: aqui se debe mostrar el precio base que esta registrado en la entidad `external_service` y se debe habilitar y actualizar tras que el usuario seleccione un servicio externo.
      - Cuenta Bancaria: select que muestra todas las cuentas bancarias registradas en el sistema de la entidad `bank_accounts`, que sirve para espesificar de que cuenta bancaria se hara el descuento.
      - Precio: aqui se debe mostrar el precio base que esta registrado en la entidad `external_service` y se debe habilitar y actualizar tras que el usuario seleccione un servicio externo.
      - Cantidad: input numerico que solo acepta numeros enteros positivos que empiezan en 1, se habilita tras la seleccion del servicio externo y el usuario puede cambiar la cantidad de servicios_externos, generalmente es solo 1 pero existen casos especiales.
      - Boton para Agregar:
        - Este boton permite agregar toda una entidad de tipo `service_order_external_services` creada a partir de los datos seleccionados en el cuarto tab, el objetivo de registrar esta entidad es que se pueda mostrar los registros en una tabla de detalles que esta fuera de los tabs en la misma pagina de registro de orden servicio, misma que esta detallada en otro punto en este mismo archivo  service_order_external_services_table.

## Tablas de detalles de tablas pibotes.
Las tablas permiten mostrar la informacion que se va seleccionando en los tabs 2, 3 y 4 para que el usuario pueda saber que se esta registrado y su modificacion. 

1. service_order_services_table
  Esta tabla muestra la informacion de los servicios y mecanicos relacionado a una orden de servicio.
  - Columnas:
    - Item : Numeracion automatica en la tabla.
    - Descripcion : Nombre del servicio seleccionado.
    - Tenico: Nombre del mecanico seleccionado.
    - Precio: Input modificable que parte de la seleccion del servicio en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Cantidad: Input modificable que parte de la seleccion del servicio en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Descuento: Input modificable que permite agregar un descuento al item de la tabla, el input solo debe permitir numeros positivos del 0 al 100 por defecto 0.
    - Sub Total: Detalle del sub total del item calculado del (precio * cantidad) - descuento.
    - Quitar: Boton para quitar el item si el usuario lo desea, tras quitar el item se debe mostrar un mensaje.

2. service_order_batches_table
  Esta tabla muestra la informacion de los lotes relacionados a una orden de servicio.
  - Columnas:
    - Item : Numeracion automatica en la tabla.
    - Descripcion : Nombre del producto del lote `batches.product->name` seleccionado.
    - Industria: Nombre de la industria del lote `batches.industry->name` seleccionado.
    - Precio: Input modificable que parte de la seleccion del lote en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Cantidad: Input modificable que parte de la seleccion del lote en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Tiempo de entrega: Input de tipo radio button con dos opciones relacionados a la propiedad `service_order_batches.delivery_time`, por defecto `IMMEDIATE`.
      - Las opciones son Enum DeliveryTime: `ORDER` (PEDIDO) · `IMMEDIATE` (INMEDIATO).
    - Descuento: Input modificable que permite agregar un descuento al item de la tabla, el input solo debe permitir numeros positivos del 0 al 100 por defecto 0. 
    - Sub Total: Detalle del sub total del item calculado del (precio * cantidad) - descuento.
    - Quitar: Boton para quitar el item si el usuario lo desea, tras quitar el item se debe mostrar un mensaje.

3. service_order_external_services_table

  Esta tabla muestra la informacion de los servicios externos y una orden de servicio.
  - Columnas:
    - Item : Numeracion automatica en la tabla.
    - Descripcion : Nombre del servicio externo seleccionado.
    - Costo: Input modificable que parte de la seleccion del servicio externo en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Precio: Input modificable que parte de la seleccion del servicio en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Cantidad: Input modificable que parte de la seleccion del servicio en el tab correspondiente, el input solo debe permitir numero enteros positivos.
    - Sub Total: Detalle del sub total del item calculado del (precio * cantidad) - descuento.
    - Quitar: Boton para quitar el item si el usuario lo desea, tras quitar el item se debe mostrar un mensaje.

## Informacion de Orden de servicio

- Adicional a los tabs y a las tablas de informacion se debe mostar un panel con los siguientes datos relacionados a una orden de servicio:
  - Tipo de pago : `service_orders.payment_type` Input de tipo Radio button  para espesificar el tipo de pago de la orden de servicio, PaymentType: `CASH` (CONTADO) · `CREDIT` (CREDITO) por defecto Cash.
  - Iva : `service_orders.with_iva` Input de tipo Radio button  para espesificar si la orden de servicio es con iva es un valor booleano, por defecto false.
  - Recomendacion : `service_orders.description` Tex area para que el usuario/operado pueda agregar una recomendacion a la orden de servicio o detalles para el cliente.
  - Fecha de retorno sugerida : `service_orders.return_date` Input de tipo date para seleccionar la fecha de retorno sugerida para el vehiculo.
  - TOTAL : `service_orders.total` calculo del total de la sumatoria de todos los sub totales de las entidadades hijas como ser `service_order_batches`,`service_order_services` y `service_order_external_services` mosmas que son detalladas en las tablas.
  - IVA : `service_orders.iva` calculo del total por el iva que tiene como valor por defecto `0.13`. 
  - Total + Iva : `service_orders.total_iva` calculo del total + el iva.
  - REGISTRAR: Boton que permite registrar los datos a nivel de base de datos en la entidad `service_orders`. 

## Otras consideraciones

1. Toma como ejemplo el modelo de product-category en `src\app\features\inventory\product-category` analizalo para mantener el estilo

2. Analiza y actualiza la base de datos `src\docs\database` que sea compatible con supabase tanto para eliminar con `src\docs\database\delete_bd.sql` para las migraciones `src\docs\database\migrate.sql` y creacion de las tablas `src\docs\database\tables.sql`

3. Todos los componentes, class de estilo y variables deben estar en ingles, solo los labels y registros en ES, no agregues iconos innecesarios y conserva el estilo base.

4. Ruta base para todo el feature en `src/app/features/service-order/`.

5. Utliza las propiedades que se espesifican en `docs/entities.md` y agrega la interfaz en `src/app/core/models/` y realiza los ajustes en otras entidades solo si fuera necesario y estan relacionadas

6. Crea los componentes necesarios en las rutas correspondientes considerando los modulos definidos en `.claude\docs\features.md` para crear cada feature en su carpeta correspondiente en `src\app\features`

7. Ajustar el menu de navegacion para coincidir con modulos y categorias definidos en `.claude\docs\features.md`

8. La ruta lazy en `app.routes.ts` bajo AdminLayout

9. Agrega el servicio correspondiente `sb-$ARGUMENTS.ts` en `core/services/supabase/` para poder registrar el crud correspondiente

10. Realiza los ajutes necesarios si es pertinente en otros componentes compatidos en `src/app/shared/components/`, directivas en  `src/app/shared/directives/` y pipes en `src/app/shared/pipes/`

11. Comprueba que todo esta funcionando correntamente con las versiones de angular 21

12. Sigue las convenciones del CLAUDE.md: signals, sin HTTP, Angular Material.
/
