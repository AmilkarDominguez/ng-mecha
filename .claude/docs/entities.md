# Entidades del Sistema de Trazabilidad — CRUDs por Módulo

> Cada entidad usa un nombre en inglés (`PascalCase`) listo para usar como **interface** en TypeScript o **modelo** en el backend. Las propiedades usan `camelCase`. Las descripciones se mantienen en español.

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
| categoryId     | Long (FK)     | nullable → product_categories.id    |
| presentationId | Long (FK)     | nullable → product_presentations.id |
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
| productId | Long (FK)     | nullable → products.id    |
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
| description | String        | nullable         |
| email       | String        | nullable         |
| address     | String        | nullable         |
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
| productId      | Long (FK)       | not null → products.id        |
| warehouseId    | Long (FK)       | not null → warehouses.id      |
| supplierId     | Long (FK)       | not null → suppliers.id       |
| industryId     | Long (FK)       | not null → industries.id      |
| brandId        | Long (FK)       | nullable → brands.id          |
| wholesalePrice | BigDecimal(8,2) | nullable                      |
| retailPrice    | BigDecimal(8,2) | nullable                      |
| finalPrice     | BigDecimal(8,2) | nullable                      |
| code           | String          | nullable                      |
| stock          | BigDecimal      | nullable                      |
| description    | String          | nullable                      |
| brand          | String          | nullable                      |
| model          | String          | nullable                      |
| expirationDate | LocalDate       | nullable                      |
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

| Columna     | Tipo          | Restricciones        |
| ----------- | ------------- | -------------------- |
| id          | String UUID    | PK, auto-generated   |
| name        | String        | nullable             |
| lastname        | String        | nullable             |
| ci          | String        | nullable             |
| expeditionCi| String        | nullable             |
| codeCi      | String        | nullable             |
| nit          | String        | nullable             |
| address    | LocalDate     | nullable             |
| email    | LocalDate     | nullable             |
| birthdate    | LocalDate     | nullable             |
| phone         | String        | nullable             |
| state       | State (enum)  | default: ACTIVE      |
| createdAt   | LocalDateTime | auto                 |
| updatedAt   | LocalDateTime | auto                 |

---
