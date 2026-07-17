# Entidades del Sistema — CRUDs por Módulo

> Cada entidad usa un nombre en inglés (`snake_case`) listo para usar como **interface** en TypeScript o **modelo** en el backend. Las descripciones se mantienen en español.


---
# Admin Module

## 1. User

**Tabla:** `users`

| Columna         | Tipo            | Restricciones      |
|-----------------|-----------------|--------------------|
| id              | String (UUID)   | PK, auto-increment |
| name            | String          | nullable           |
| lastname        | String          | nullable           |
| email           | String          | unique, not null   |
| password        | String          | not null           |
| allow_deletion  | Boolean         | default: true      |
| rol             | UserRole (enum) | default: INVENTORY |
| state           | State (enum)    | default: ACTIVE    |
| created_at      | LocalDateTime   | auto               |
| updated_at      | LocalDateTime   | auto               |

**Enum UserRole:** `ADMIN` (Admin) · `SALES` (Ventas) · `INVENTORY` (Inventario)
---

---
# Inventory Module

## 1. ProductCategory

**Tabla:** `product_categories`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          | String (UUID) | PK, auto-increment |
| name        | String        | nullable         |
| title       | String        | nullable         |
| description | String        | nullable         |
| state       | State (enum)  | default: ACTIVE  |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

**Relaciones:**
- One-to-Many → `Product`

---

## 2. ProductPresentation

**Tabla:** `product_presentations`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          | String (UUID) | PK, auto-increment |
| name        | String        | nullable         |
| code        | String        | nullable         |
| description | String        | nullable         |
| state       | State (enum)  | default: ACTIVE  |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

**Relaciones:**
- One-to-Many → `Product`

---

## 3. Product

**Tabla:** `products`

| Columna        | Tipo          | Restricciones                       |
|----------------|---------------|-------------------------------------|
| id             | String (UUID) | PK, auto-increment                  |
| category_id     | Long (FK)     | nullable → product_categories.id    |
| presentation_id | Long (FK)     | nullable → product_presentations.id |
| name           | String        | nullable                            |
| description    | String        | nullable                            |
| photo          | String        | nullable                            |
| state          | State (enum)  | default: ACTIVE                     |
| created_at      | LocalDateTime | auto                                |
| updated_at      | LocalDateTime | auto                                |

**Relaciones:**
- Many-to-One → `ProductCategory`
- Many-to-One → `ProductPresentation`
- One-to-Many → `Batch`
- One-to-Many → `Multimedia`

---

## 4. Multimedia

**Tabla:** `multimedia`

| Columna   | Tipo          | Restricciones             |
|-----------|---------------|---------------------------|
| id        | String (UUID) | PK, auto-increment        |
| product_id | Long (FK)     | nullable → products.id    |
| path      | String        | nullable                  |
| created_at | LocalDateTime | auto                      |
| updated_at | LocalDateTime | auto                      |

**Relaciones:**
- Many-to-One → `Product`

---

## 5. Supplier

**Tabla:** `suppliers`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          | String (UUID) | PK, auto-increment |
| name        | String        | not null         |
| nit          | String        | nullable        |
| description | String        | nullable         |
| email       | String        | nullable         |
| address     | String        | nullable         |
| phone         | String        | nullable       |
| maps_url      | String        | nullable       |
| state       | State (enum)  | default: ACTIVE  |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

**Relaciones:**
- One-to-Many → `Batch`

---

## 6. Industry

**Tabla:** `industries`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          |  String (UUID)| PK, auto-increment |
| name        | String        | not null         |
| description | String        | nullable         |
| state       | State (enum)  | default: ACTIVE  |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

**Relaciones:**
- One-to-Many → `Batch`

---

## 7. Brand

**Tabla:** `brands`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          | String (UUID) | PK, auto-increment |
| name        | String        | nullable         |
| description | String        | nullable         |
| score       | String        | nullable         |
| state       | State (enum)  | default: ACTIVE  |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

**Relaciones:**
- One-to-Many → `Batch`

---

## 8. Warehouse

**Tabla:** `warehouses`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          | String (UUID) | PK, auto-increment |
| name        | String        | not null         |
| description | String        | nullable         |
| state       | State (enum)  | default: ACTIVE  |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

**Relaciones:**
- One-to-Many → `Batch`

---

## 9. Batch

**Tabla:** `batches`

| Columna        | Tipo            | Restricciones                 |
|----------------|-----------------|-------------------------------|
| id             | String (UUID)   | PK, auto-increment            |
| product_id      | Long (FK)       | not null → products.id        |
| warehouse_id    | Long (FK)       | not null → warehouses.id      |
| supplier_id     | Long (FK)       | not null → suppliers.id       |
| industry_id     | Long (FK)       | not null → industries.id      |
| brand_id        | Long (FK)       | nullable → brands.id          |
| price           | BigDecimal(8,2) | nullable                      |
| cost            | BigDecimal(8,2) | nullable                      |
| code            | String          | nullable                      |
| stock           | BigDecimal      | nullable                      |
| description     | String          | nullable                      |
| compatible_brands | String          | nullable                      |
| compatible_models | String          | nullable                      |
| expiration_date | LocalDate       | nullable                      |
| state          | State (enum)    | default: ACTIVE               |
| created_at      | LocalDateTime   | auto                          |
| updated_at      | LocalDateTime   | auto                          |

**Relaciones:**
- Many-to-One → `Product`
- Many-to-One → `Warehouse`
- Many-to-One → `Supplier`
- Many-to-One → `Industry`
- Many-to-One → `Brand`
- One-to-Many → `ServiceOrderBatch`
- One-to-Many → `QuoteBatch`
---

# Workshop Module

## 1. Contact

**Tabla:** `contacts`

| Columna     | Tipo          | Restricciones    |
|-------------|---------------|------------------|
| id          | String (UUID) | PK, auto-increment|
| referenceId | UUID          | nullable         |
| name       | String        | nullable         |
| number     | String        | nullable         |
| type        | ContactType (enum) | default: PRIMARY, nullable |
| created_at   | LocalDateTime | auto             |
| updated_at   | LocalDateTime | auto             |

---

## 2. Customer

**Tabla:** `customers`

| Columna     | Tipo                   | Restricciones        |
| ----------- | ---------------------- | -------------------- |
| id          | String UUID            | PK, auto-generated   |
| name        | String                 | nullable             |
| lastname    | String                 | nullable             |
| ci          | String                 | nullable             |
| nit         | String                 | nullable             |
| address     | String                 | nullable             |
| birthdate   | LocalDate              | nullable             |
| phone       | String                 | nullable             |
| rating      | CustomerRating (enum)  | nullable             |
| state       | State (enum)           | default: ACTIVE      |
| created_at  | LocalDateTime          | auto                 |
| updated_at  | LocalDateTime          | auto                 |

**Enum CustomerRating:** `GOOD` (Bueno) · `REGULAR` (Regular) · `BAD` (Malo)

---

## 3. Vehicle

**Tabla:** `vehicles`

| Columna       | Tipo          | Restricciones           |
| ------------- | ------------- | ----------------------- |
| id            | String UUID   | PK, auto-generated      |
| customer_id    | UUID (FK)     | nullable → customers.id|
| license_plate  | String        | nullable               |
| brand         | String        | nullable                |
| model         | String        | nullable                |
| displacement  | String        | nullable                |
| year          | String        | nullable                |
| chassis_number | String        | nullable               |
| description   | String        | nullable                |
| state         | State (enum)  | default: ACTIVE         |
| created_at     | LocalDateTime | auto                    |
| updated_at     | LocalDateTime | auto                    |

**Relaciones:**

- Many-to-One → `Customer`
- One-to-Many → `ServiceOrder`
- One-to-Many → `Quote`

---

## 4. Mechanics

**Tabla:** `mechanics`

| Columna          | Tipo          | Restricciones        |
| ---------------- | ------------- | -------------------- |
| id               | String UUID   | PK, auto-generated   |
| name             | String        | nullable             |
| lastname         | String        | nullable             |
| ci               | String        | nullable             |
| nit              | String        | nullable             |
| address          | LocalDate     | nullable             |
| email            | LocalDate     | nullable             |
| birthdate        | LocalDate     | nullable             |
| phone            | String        | nullable             |
| incorporated_at  | LocalDateTime | nullable             |
| retired_at       | LocalDateTime | nullable             |
| state            | State (enum)  | default: ACTIVE      |
| created_at       | LocalDateTime | auto                 |
| updated_at       | LocalDateTime | auto                 |

**Relaciones:**

- One-to-Many → `LabourDetail`

---

## 5. Service

**Tabla:** `services`

| Columna     | Tipo            | Restricciones      |
| ----------- | --------------- | ------------------ |
| id          | String UUID     | PK, auto-generated |
| name        | String          | nullable           |
| code        | String          | nullable           |
| description | String          | nullable           |
| price       | BigDecimal(8,2) | nullable           |
| state       | State (enum)    | default: ACTIVE    |
| created_at   | LocalDateTime | auto                |
| updated_at   | LocalDateTime | auto                |

**Relaciones:**

- One-to-Many → `LabourDetail`


---

## 6. ExternalServices

**Tabla:** `external_services`

| Columna     | Tipo                                 | Restricciones        |
| ----------- | -------------------------------------| ------------------   |
| id          | String UUID                          | PK, auto-generated   |
| name        | String                               | nullable             |
| company_name| String                               | nullable             |
| description | String                               | nullable             |
| address     | LocalDate                            | nullable             |
| phone       | String                               | nullable             |
| rating      | ExternalServicesRating (enum)        | nullable             |
| cost        | BigDecimal(8,2)                      | nullable             |
| price       | BigDecimal(8,2)                      | nullable             |
| state       | State (enum)                         | default: ACTIVE      |
| created_at  | LocalDateTime | auto                 | LocalDateTime | auto |
| updated_at  | LocalDateTime | auto                 | LocalDateTime | auto |

**Enum ExternalServicesRating:** `GOOD` (Bueno) · `REGULAR` (Regular) · `BAD` (Malo)

# Accounting Module

---

## 1. BankAccount

**Tabla:** `bank_accounts`

| Columna       | Tipo                                  | Restricciones        |
| -----------   | ------------------------------------- | ------------------   |
| id            | String UUID                           | PK, auto-generated   |
| name          | String                                | nullable             |
| description   | String                                | nullable             |
| number        | String                                | nullable             |
| balance       | BigDecimal(8,2)                       | nullable             |
| state         | State (enum)                          | default: ACTIVE      |
| created_at    | LocalDateTime | auto                  | LocalDateTime | auto |
| updated_at    | LocalDateTime | auto                  | LocalDateTime | auto |

---

## 2. BankTransactionType

**Tabla:** `bank_transaction_types`

| Columna      | Tipo                            | Restricciones      |
| ------------ | ------------------------------- | ------------------ |
| id           | String UUID                     | PK, auto-generated |
| name         | String                          | nullable           |
| description  | String                          | nullable           |
| type         | BankTransactionType (enum)      | nullable           |
| state        | State (enum)                    | default: ACTIVE    |
| allow_deletion | Boolean                       | default: true      |
| created_at   | LocalDateTime                   | auto               |
| updated_at   | LocalDateTime                   | auto               |

Mandatory records with allow_deletion = false

```
'Creación de cuenta bancaria.'[INGRESO] ,
'Deposito a cuenta bancaria.'[INGRESO],
'Retiro de cuenta bancaria.'[EGRESO],
'Compra lote de productos.'[EGRESO],
'Pago de orden de servicio.'[INGRESO],
'Pago servicio externo.'[EGRESO],
```

**Enum BankTransactionType:** `INCOME` (Ingreso) · `EXPENSE` (Egreso)

---

## 3. BankAccountHistory

**Tabla:** `bank_account_histories`

| Columna                 | Tipo            | Restricciones                          |
| --------------------    | --------------- | --------------------------------------- |
| id                      | String UUID     | PK, auto-generated                      |
| bank_account_id         | UUID (FK)       | nullable → bank_accounts.id             |
| user_id                 | UUID (FK)       | nullable → users.id                     |
| transaction_type_id     | UUID (FK)       | nullable → bank_transaction_types.id    |
| amount                  | BigDecimal(8,2) | nullable                                |
| balance                 | BigDecimal(8,2) | nullable, saldo de la cuenta post-movimiento |
| transaction_reference   | String          | nullable, referencia libre (no FK formal). Para pagos de orden de servicio guarda `service_orders.id` |
| concept                 | String          | nullable                                |
| created_at              | LocalDateTime   | auto                                    |
| updated_at              | LocalDateTime   | auto                                    |

**Relaciones:**

- Many-to-One → `bank_accounts`
- Many-to-One → `users`
- Many-to-One → `bank_transaction_types`

**Uso — Pago de orden de servicio:**
Al registrar un pago de una orden de servicio se inserta un registro aquí con `transaction_type_id` apuntando al tipo `'Pago de orden de servicio'`[INGRESO] y `transaction_reference = service_orders.id`. El listado de pagos de una orden se obtiene filtrando por `transaction_reference` + `transaction_type_id`. Editar/eliminar un pago revierte y reaplica el ajuste correspondiente en `bank_accounts.balance` y en `service_orders.have`/`must`.

**Atomicidad:** registrar/editar/eliminar un pago se ejecuta mediante RPCs de Postgres (`register_service_order_payment`, `edit_service_order_payment`, `delete_service_order_payment`, ver `migrate.sql` v19) — no con llamadas REST separadas desde el cliente. Un pago toca 3 tablas; sin una transacción real, una falla a mitad de camino deja el balance desincronizado (bug real detectado y corregido el 2026-07-10).

---

# Quotes Module

> Diseño completo, RPCs y flujo de negocio en `.claude/commands/quote-module.md`. Entidades propias (no reutilizan las tablas de `ServiceOrder`) porque una cotización vive un ciclo de vida distinto (pendiente → aprobada → convertida/rechazada/expirada, con vencimiento) y varias cotizaciones pueden alimentar la misma orden — incluso agregarse a una orden que ya está `IN_PROGRESS`.

---

## 1. Quote

**Tabla:** `quotes`

| Columna                    | Tipo              | Restricciones                  |
| --------------------------- | ----------------- | ------------------------------- |
| id                          | UUID               | PK, auto-generated              |
| customer_id                 | UUID (FK)          | not null → customers.id         |
| vehicle_id                  | UUID (FK)          | nullable → vehicles.id          |
| user_id                     | UUID (FK)          | nullable → users.id             |
| converted_service_order_id  | UUID (FK)          | nullable → service_orders.id — se llena al convertir |
| number                      | String             | nullable                        |
| description                 | String             | nullable                        |
| total                       | BigDecimal(8,2)    | nullable                        |
| iva                         | BigDecimal(8,2)    | nullable                        |
| total_iva                   | BigDecimal(8,2)    | nullable                        |
| with_iva                    | Boolean            | default: false                  |
| expiration_date             | LocalDate          | nullable — vencimiento de la reserva de stock |
| state                       | QuoteState (enum)  | default: PENDING                |
| created_at                  | LocalDateTime      | auto                             |
| updated_at                  | LocalDateTime      | auto                             |

**Enum QuoteState:** `PENDING` (Pendiente) · `APPROVED` (Aprobada) · `REJECTED` (Rechazada) · `EXPIRED` (Expirada) · `CONVERTED` (Convertida) · `CANCELED` (Anulada)

**Relaciones:**
- Many-to-One → `Customer`
- Many-to-One → `Vehicle`
- Many-to-One → `User`
- Many-to-One → `ServiceOrder` (vía `converted_service_order_id`; varias cotizaciones pueden apuntar a la misma orden)
- One-to-Many → `QuoteService`
- One-to-Many → `QuoteBatch`
- One-to-Many → `QuoteExternalService`

---

## 2. QuoteService

**Tabla:** `quote_services`

| Columna    | Tipo            | Restricciones           |
| ---------- | --------------- | ------------------------ |
| id         | UUID            | PK, auto-generated       |
| quote_id   | UUID (FK)       | not null → quotes.id     |
| service_id | UUID (FK)       | nullable → services.id   |
| discount   | BigDecimal(8,2) | nullable                 |
| price      | BigDecimal(8,2) | nullable                 |
| quantity   | BigDecimal      | nullable                 |
| subtotal   | BigDecimal(8,2) | nullable                 |
| created_at | LocalDateTime   | auto                     |
| updated_at | LocalDateTime   | auto                     |

---

## 3. QuoteBatch

**Tabla:** `quote_batches`

| Columna       | Tipo                | Restricciones                  |
| ------------- | -------------------- | -------------------------------- |
| id            | UUID                 | PK, auto-generated               |
| quote_id      | UUID (FK)            | not null → quotes.id             |
| batch_id      | UUID (FK)            | nullable → batches.id — null si el repuesto no está en inventario |
| description   | String               | nullable — requerido si `batch_id` es null |
| delivery_time | DeliveryTime (enum)  | default: IMMEDIATE               |
| quantity      | BigDecimal           | nullable                         |
| price         | BigDecimal(8,2)      | nullable                         |
| discount      | BigDecimal(8,2)      | nullable                         |
| subtotal      | BigDecimal(8,2)      | nullable                         |
| created_at    | LocalDateTime        | auto                              |
| updated_at    | LocalDateTime        | auto                              |

> Reutiliza el enum `DeliveryTime` ya definido para `ServiceOrderBatch`. Solo `IMMEDIATE` + `batch_id` no nulo genera una reserva (`BatchReservation`) — `ORDER` (a pedir a proveedor) o `batch_id` nulo (repuesto no catalogado) son puramente una estimación de costo, sin reserva de stock.

**Relaciones:**
- Many-to-One → `Quote`
- Many-to-One → `Batch`
- One-to-One → `BatchReservation` (si aplica)

---

## 4. QuoteExternalService

**Tabla:** `quote_external_services`

| Columna             | Tipo            | Restricciones                    |
| -------------------- | --------------- | ---------------------------------- |
| id                   | UUID            | PK, auto-generated                 |
| quote_id             | UUID (FK)       | not null → quotes.id               |
| external_service_id  | UUID (FK)       | nullable → external_services.id    |
| cost                 | BigDecimal(8,2) | nullable                           |
| price                | BigDecimal(8,2) | nullable                           |
| quantity             | BigDecimal      | nullable                           |
| subtotal             | BigDecimal(8,2) | nullable                           |
| created_at           | LocalDateTime   | auto                                |
| updated_at           | LocalDateTime   | auto                                |

---

## 5. BatchReservation

**Tabla:** `batch_reservations`

**No es un CRUD de usuario** — se crea/libera/consume únicamente vía las RPCs descritas en `.claude/commands/quote-module.md` (`reserve_quote_batches`, `release_quote_reservations`, `convert_quote_to_order`).

| Columna         | Tipo                    | Restricciones                        |
| ---------------- | ------------------------ | -------------------------------------- |
| id               | UUID                     | PK, auto-generated                     |
| quote_batch_id   | UUID (FK)                | not null → quote_batches.id            |
| batch_id         | UUID (FK)                | not null → batches.id                  |
| quantity         | BigDecimal               | not null                               |
| reserved_until   | LocalDate                | not null — copiado de `quotes.expiration_date` al aprobar |
| state            | ReservationState (enum)  | default: ACTIVE                        |
| created_at       | LocalDateTime            | auto                                    |
| updated_at       | LocalDateTime            | auto                                    |

**Enum ReservationState:** `ACTIVE` (Activa) · `CONSUMED` (Consumida) · `RELEASED` (Liberada) · `EXPIRED` (Expirada)

**Uso — stock disponible sin tocar `batches.stock`:**
```
available_stock(batch) = batch.stock
  - SUM(batch_reservations.quantity WHERE state='ACTIVE' AND reserved_until >= CURRENT_DATE)
  - SUM(service_order_batches.quantity WHERE service_order.state='IN_PROGRESS')
```
El primer término son cotizaciones aprobadas vigentes (reserva blanda, con vencimiento); el segundo son órdenes ya en curso (compromiso firme, sin vencimiento — ninguna de las dos resta de `batches.stock`, que sigue siendo el stock físico real ajustado solo por compras de lote).

---

# Service Orders Module

---

## 1. ServiceOrder

**Tabla:** `service_orders`

| Columna               | Tipo               | Restricciones           |
| --------------------- | ------------------ | ----------------------- |
| id                    | UUID               | PK, auto-generated      |
| customer_id           | UUID (FK)          | not null → customers.id |
| vehicle_id            | UUID (FK)          | nullable → vehicles.id  |
| mechanic_id           | UUID (FK)          | nullable → mechanics.id |
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

> `draft_expiration_date` quedó sin uso en la UI (ver `service-order-flow.md`). Con el módulo de Cotizaciones, el vencimiento de la reserva vive en `quotes.expiration_date`, NO aquí — no reutilizar esta columna para eso. `ServiceOrder` deliberadamente **no** tiene un `quote_id` de cabecera: una orden puede originarse en varias cotizaciones (y puede recibir cotizaciones adicionales estando `IN_PROGRESS`), así que el vínculo vive a nivel de línea (`quote_id` en las 3 tablas pivot de abajo) y a nivel de cotización (`quotes.converted_service_order_id`). Ver `.claude/commands/quote-module.md`.

---

## 2. ServiceOrderBatch

**Tabla:** `service_order_batches`

| Columna          | Tipo                | Restricciones                |
| ---------------- | ------------------- | ---------------------------- |
| id               | UUID                | PK, auto-generated           |
| batch_id         | UUID (FK)           | nullable → batches.id        |
| service_order_id | UUID (FK)           | nullable → service_orders.id |
| quote_id         | UUID (FK)           | nullable → quotes.id — cotización de origen (null si la línea se agregó directo en la orden) |
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
| service_id       | UUID (FK)       | nullable → services.id       |
| service_order_id | UUID (FK)       | nullable → service_orders.id |
| quote_id         | UUID (FK)       | nullable → quotes.id — cotización de origen |
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
| quote_id                | UUID (FK)       | nullable → quotes.id — cotización de origen |
| bank_account_id         | UUID (FK)       | nullable → bank_accounts.id        |
| cost                    | BigDecimal(8,2) | nullable                           |
| price                   | BigDecimal(8,2) | nullable                           |
| quantity                | BigDecimal      | nullable                           |
| subtotal                | BigDecimal(8,2) | nullable                           |
| created_at              | LocalDateTime   | auto                               |
| updated_at              | LocalDateTime   | auto                               |

---
