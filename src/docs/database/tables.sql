-- ============================================================
-- Mecha Sys — Inventory Module
-- Database: Supabase (PostgreSQL)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TYPES (enums)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE state_enum AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_type_enum AS ENUM ('PRIMARY', 'SECONDARY', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_rating_enum AS ENUM ('GOOD', 'REGULAR', 'BAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE external_services_rating_enum AS ENUM ('GOOD', 'REGULAR', 'BAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'SALES', 'INVENTORY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bank_transaction_kind AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- TABLES
-- ============================================================

-- 0. users (Admin Module)
CREATE TABLE IF NOT EXISTS users (
  id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT,
  lastname       TEXT,
  email          TEXT            NOT NULL UNIQUE,
  password       TEXT            NOT NULL,
  allow_deletion BOOLEAN         NOT NULL DEFAULT true,
  rol            user_role_enum  NOT NULL DEFAULT 'INVENTORY',
  state          state_enum      NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 1. product_categories
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  title       TEXT,
  description TEXT,
  state       state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. product_presentations
CREATE TABLE IF NOT EXISTS product_presentations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  code        TEXT,
  description TEXT,
  state       state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. products
CREATE TABLE IF NOT EXISTS products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID        REFERENCES product_categories(id)    ON DELETE SET NULL,
  presentation_id UUID        REFERENCES product_presentations(id) ON DELETE SET NULL,
  name            TEXT,
  description     TEXT,
  photo           TEXT,
  state           state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. multimedia
CREATE TABLE IF NOT EXISTS multimedia (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        REFERENCES products(id) ON DELETE CASCADE,
  path       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  nit         TEXT,
  description TEXT,
  email       TEXT,
  address     TEXT,
  phone       TEXT,
  maps_url    TEXT,
  state       state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. industries
CREATE TABLE IF NOT EXISTS industries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  state       state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. brands
CREATE TABLE IF NOT EXISTS brands (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  description TEXT,
  score       TEXT,
  state       state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  state       state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. batches
CREATE TABLE IF NOT EXISTS batches (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID           NOT NULL REFERENCES products(id)    ON DELETE RESTRICT,
  warehouse_id    UUID           NOT NULL REFERENCES warehouses(id)  ON DELETE RESTRICT,
  supplier_id     UUID           NOT NULL REFERENCES suppliers(id)   ON DELETE RESTRICT,
  industry_id     UUID           NOT NULL REFERENCES industries(id)  ON DELETE RESTRICT,
  brand_id        UUID           REFERENCES brands(id)               ON DELETE SET NULL,
  cost            NUMERIC(10,2),
  price           NUMERIC(10,2),
  code            TEXT,
  stock           NUMERIC,
  description     TEXT,
  compatible_brands TEXT,
  compatible_models TEXT,
  expiration_date DATE,
  state           state_enum     NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Workshop Module
-- ============================================================

-- 10. contacts
CREATE TABLE IF NOT EXISTS contacts (
  id           UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID,
  name         TEXT,
  number       TEXT,
  type         contact_type_enum  DEFAULT 'PRIMARY',
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- 11. customers
CREATE TABLE IF NOT EXISTS customers (
  id             UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT,
  lastname       TEXT,
  ci             TEXT,
  nit            TEXT,
  address        TEXT,
  birthdate      DATE,
  phone          TEXT,
  rating         customer_rating_enum,
  state          state_enum            NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);


-- 12. mechanics
CREATE TABLE IF NOT EXISTS mechanics (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT,
  lastname       TEXT,
  ci             TEXT,
  nit            TEXT,
  address        TEXT,
  email          TEXT,
  birthdate      DATE,
  phone          TEXT,
  incorporated_at TIMESTAMPTZ,
  retired_at      TIMESTAMPTZ,
  state          state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 13. services
CREATE TABLE IF NOT EXISTS services (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  code        TEXT,
  description TEXT,
  price       NUMERIC(8,2),
  state       state_enum     NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- 14. external_services
CREATE TABLE IF NOT EXISTS external_services (
  id           UUID                          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  company_name TEXT,
  description  TEXT,
  address      TEXT,
  phone        TEXT,
  rating       external_services_rating_enum,
  cost        NUMERIC(8,2),
  price       NUMERIC(8,2),
  state       state_enum                    NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ                   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ                   NOT NULL DEFAULT NOW()
);


-- 15. vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID        REFERENCES customers(id) ON DELETE SET NULL,
  license_plate  TEXT,
  brand          TEXT,
  model          TEXT,
  displacement   TEXT,
  year           TEXT,
  chassis_number TEXT,
  description    TEXT,
  state          state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Accounts Module
-- ============================================================

-- 16. bank_transaction_types
CREATE TABLE IF NOT EXISTS bank_transaction_types (
  id             UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT,
  description    TEXT,
  type           bank_transaction_kind,
  allow_deletion BOOLEAN                 NOT NULL DEFAULT true,
  state          state_enum              NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- Seed: registros por defecto
INSERT INTO bank_transaction_types (name, description, type, allow_deletion, state) VALUES
  ('Creación de cuenta bancaria',  'Creación de cuenta bancaria.',  'INCOME',  false, 'ACTIVE'),
  ('Depósito a cuenta bancaria',   'Depósito a cuenta bancaria.',   'INCOME',  false, 'ACTIVE'),
  ('Retiro de cuenta bancaria',    'Retiro de cuenta bancaria.',    'EXPENSE', false, 'ACTIVE'),
  ('Compra lote de productos',     'Compra lote de productos.',     'EXPENSE', false, 'ACTIVE'),
  ('Pago de orden de servicio',    'Pago de orden de servicio.',    'INCOME',  false, 'ACTIVE'),
  ('Pago servicio externo',        'Pago servicio externo.',        'EXPENSE', false, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 17. bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  description TEXT,
  number      TEXT,
  balance     NUMERIC(8,2),
  state       state_enum     NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Service Orders Module
-- ============================================================

DO $$ BEGIN
  CREATE TYPE order_state_enum AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type_enum AS ENUM ('CASH', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE delivery_time_enum AS ENUM ('ORDER', 'IMMEDIATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 18. service_orders
CREATE TABLE IF NOT EXISTS service_orders (
  id                    UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID                 NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id            UUID                 REFERENCES vehicles(id)           ON DELETE SET NULL,
  user_id               UUID                 REFERENCES users(id)              ON DELETE SET NULL,
  number                TEXT,
  description           TEXT,
  total                 NUMERIC(10,2),
  have                  NUMERIC(10,2)        DEFAULT 0,
  must                  NUMERIC(10,2),
  iva                   NUMERIC(10,2),
  total_iva             NUMERIC(10,2),
  with_iva              BOOLEAN              NOT NULL DEFAULT false,
  mileage               TEXT,
  draft_expiration_date DATE,
  started_date          DATE,
  ended_date            DATE,
  return_date           DATE,
  state                 order_state_enum     NOT NULL DEFAULT 'IN_PROGRESS',
  payment_type          payment_type_enum    NOT NULL DEFAULT 'CASH',
  created_at            TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- 19. service_order_services
CREATE TABLE IF NOT EXISTS service_order_services (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id       UUID             REFERENCES mechanics(id)       ON DELETE SET NULL,
  service_id        UUID             REFERENCES services(id)        ON DELETE SET NULL,
  service_order_id  UUID             REFERENCES service_orders(id)  ON DELETE CASCADE,
  discount          NUMERIC(8,2),
  price             NUMERIC(8,2),
  quantity          NUMERIC,
  subtotal          NUMERIC(8,2),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 20. service_order_batches
CREATE TABLE IF NOT EXISTS service_order_batches (
  id                UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID                 REFERENCES batches(id)        ON DELETE SET NULL,
  service_order_id  UUID                 REFERENCES service_orders(id) ON DELETE CASCADE,
  quantity          NUMERIC,
  delivery_time     delivery_time_enum   NOT NULL DEFAULT 'IMMEDIATE',
  price             NUMERIC(8,2),
  discount          NUMERIC(8,2),
  subtotal          NUMERIC(8,2),
  created_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- 21. service_order_external_services
CREATE TABLE IF NOT EXISTS service_order_external_services (
  id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  external_service_id  UUID             REFERENCES external_services(id) ON DELETE SET NULL,
  service_order_id     UUID             REFERENCES service_orders(id)    ON DELETE CASCADE,
  bank_account_id      UUID             REFERENCES bank_accounts(id)     ON DELETE SET NULL,
  cost                 NUMERIC(8,2),
  price                NUMERIC(8,2),
  quantity             NUMERIC,
  subtotal             NUMERIC(8,2),
  created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email              ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_state              ON users(state);
CREATE INDEX IF NOT EXISTS idx_products_category_id     ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_presentation_id ON products(presentation_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_product_id    ON multimedia(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_id       ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_id     ON batches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_supplier_id      ON batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_industry_id      ON batches(industry_id);
CREATE INDEX IF NOT EXISTS idx_batches_brand_id         ON batches(brand_id);
CREATE INDEX IF NOT EXISTS idx_contacts_reference_id    ON contacts(reference_id);
CREATE INDEX IF NOT EXISTS idx_mechanics_state           ON mechanics(state);
CREATE INDEX IF NOT EXISTS idx_services_state            ON services(state);
CREATE INDEX IF NOT EXISTS idx_external_services_state   ON external_services(state);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id     ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_state           ON vehicles(state);
CREATE INDEX IF NOT EXISTS idx_customers_state                      ON customers(state);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id           ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_vehicle_id            ON service_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_state                 ON service_orders(state);
CREATE INDEX IF NOT EXISTS idx_service_order_services_order_id      ON service_order_services(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_batches_order_id       ON service_order_batches(service_order_id);
CREATE INDEX IF NOT EXISTS idx_service_order_external_order_id      ON service_order_external_services(service_order_id);


-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'product_categories',
    'product_presentations',
    'products',
    'multimedia',
    'suppliers',
    'industries',
    'brands',
    'warehouses',
    'batches',
    'contacts',
    'customers',
    'mechanics',
    'services',
    'external_services',
    'vehicles',
    'bank_transaction_types',
    'bank_accounts',
    'service_orders',
    'service_order_services',
    'service_order_batches',
    'service_order_external_services'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
       CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE multimedia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands                ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE services              ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_batches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_external_services    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES — authenticated role
-- SELECT / INSERT / UPDATE / DELETE
-- ============================================================

-- users
CREATE POLICY "auth_select_users"
  ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_users"
  ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_users"
  ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_users"
  ON users FOR DELETE TO authenticated USING (true);

-- product_categories
CREATE POLICY "auth_select_product_categories"
  ON product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_product_categories"
  ON product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_product_categories"
  ON product_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_product_categories"
  ON product_categories FOR DELETE TO authenticated USING (true);

-- product_presentations
CREATE POLICY "auth_select_product_presentations"
  ON product_presentations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_product_presentations"
  ON product_presentations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_product_presentations"
  ON product_presentations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_product_presentations"
  ON product_presentations FOR DELETE TO authenticated USING (true);

-- products
CREATE POLICY "auth_select_products"
  ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_products"
  ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_products"
  ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_products"
  ON products FOR DELETE TO authenticated USING (true);

-- multimedia
CREATE POLICY "auth_select_multimedia"
  ON multimedia FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_multimedia"
  ON multimedia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_multimedia"
  ON multimedia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_multimedia"
  ON multimedia FOR DELETE TO authenticated USING (true);

-- suppliers
CREATE POLICY "auth_select_suppliers"
  ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_suppliers"
  ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_suppliers"
  ON suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_suppliers"
  ON suppliers FOR DELETE TO authenticated USING (true);

-- industries
CREATE POLICY "auth_select_industries"
  ON industries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_industries"
  ON industries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_industries"
  ON industries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_industries"
  ON industries FOR DELETE TO authenticated USING (true);

-- brands
CREATE POLICY "auth_select_brands"
  ON brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_brands"
  ON brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_brands"
  ON brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_brands"
  ON brands FOR DELETE TO authenticated USING (true);

-- warehouses
CREATE POLICY "auth_select_warehouses"
  ON warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_warehouses"
  ON warehouses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_warehouses"
  ON warehouses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_warehouses"
  ON warehouses FOR DELETE TO authenticated USING (true);

-- batches
CREATE POLICY "auth_select_batches"
  ON batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_batches"
  ON batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_batches"
  ON batches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_batches"
  ON batches FOR DELETE TO authenticated USING (true);

-- contacts
CREATE POLICY "auth_select_contacts"
  ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_contacts"
  ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_contacts"
  ON contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_contacts"
  ON contacts FOR DELETE TO authenticated USING (true);

-- customers
CREATE POLICY "auth_select_customers"
  ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_customers"
  ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_customers"
  ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_customers"
  ON customers FOR DELETE TO authenticated USING (true);

-- mechanics
CREATE POLICY "auth_select_mechanics"
  ON mechanics FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_mechanics"
  ON mechanics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_mechanics"
  ON mechanics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_mechanics"
  ON mechanics FOR DELETE TO authenticated USING (true);

-- services
CREATE POLICY "auth_select_services"
  ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_services"
  ON services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_services"
  ON services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_services"
  ON services FOR DELETE TO authenticated USING (true);

-- external_services
CREATE POLICY "auth_select_external_services"
  ON external_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_external_services"
  ON external_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_external_services"
  ON external_services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_external_services"
  ON external_services FOR DELETE TO authenticated USING (true);

-- vehicles
CREATE POLICY "auth_select_vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_vehicles"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_vehicles"
  ON vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_vehicles"
  ON vehicles FOR DELETE TO authenticated USING (true);


-- bank_transaction_types
CREATE POLICY "auth_select_bank_transaction_types"
  ON bank_transaction_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_transaction_types"
  ON bank_transaction_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_transaction_types"
  ON bank_transaction_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_bank_transaction_types"
  ON bank_transaction_types FOR DELETE TO authenticated USING (true);

-- bank_accounts
CREATE POLICY "auth_select_bank_accounts"
  ON bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_accounts"
  ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_accounts"
  ON bank_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_bank_accounts"
  ON bank_accounts FOR DELETE TO authenticated USING (true);


-- ============================================================
-- RLS POLICIES — anon role (desarrollo sin auth activo)
-- Permite acceso completo al rol anon mientras no hay sesión.
-- Remover estas políticas cuando se active el sistema de auth.
-- ============================================================

-- users
CREATE POLICY "anon_select_users"
  ON users FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_users"
  ON users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_users"
  ON users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_users"
  ON users FOR DELETE TO anon USING (true);

-- product_categories
CREATE POLICY "anon_select_product_categories"
  ON product_categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_product_categories"
  ON product_categories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_product_categories"
  ON product_categories FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_product_categories"
  ON product_categories FOR DELETE TO anon USING (true);

-- product_presentations
CREATE POLICY "anon_select_product_presentations"
  ON product_presentations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_product_presentations"
  ON product_presentations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_product_presentations"
  ON product_presentations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_product_presentations"
  ON product_presentations FOR DELETE TO anon USING (true);

-- products
CREATE POLICY "anon_select_products"
  ON products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_products"
  ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_products"
  ON products FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_products"
  ON products FOR DELETE TO anon USING (true);

-- multimedia
CREATE POLICY "anon_select_multimedia"
  ON multimedia FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_multimedia"
  ON multimedia FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_multimedia"
  ON multimedia FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_multimedia"
  ON multimedia FOR DELETE TO anon USING (true);

-- suppliers
CREATE POLICY "anon_select_suppliers"
  ON suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_suppliers"
  ON suppliers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_suppliers"
  ON suppliers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_suppliers"
  ON suppliers FOR DELETE TO anon USING (true);

-- industries
CREATE POLICY "anon_select_industries"
  ON industries FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_industries"
  ON industries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_industries"
  ON industries FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_industries"
  ON industries FOR DELETE TO anon USING (true);

-- brands
CREATE POLICY "anon_select_brands"
  ON brands FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_brands"
  ON brands FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_brands"
  ON brands FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_brands"
  ON brands FOR DELETE TO anon USING (true);

-- warehouses
CREATE POLICY "anon_select_warehouses"
  ON warehouses FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_warehouses"
  ON warehouses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_warehouses"
  ON warehouses FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_warehouses"
  ON warehouses FOR DELETE TO anon USING (true);

-- batches
CREATE POLICY "anon_select_batches"
  ON batches FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_batches"
  ON batches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_batches"
  ON batches FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_batches"
  ON batches FOR DELETE TO anon USING (true);

-- contacts
CREATE POLICY "anon_select_contacts"
  ON contacts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_contacts"
  ON contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_contacts"
  ON contacts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_contacts"
  ON contacts FOR DELETE TO anon USING (true);

-- customers
CREATE POLICY "anon_select_customers"
  ON customers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_customers"
  ON customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_customers"
  ON customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_customers"
  ON customers FOR DELETE TO anon USING (true);

-- mechanics
CREATE POLICY "anon_select_mechanics"
  ON mechanics FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_mechanics"
  ON mechanics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_mechanics"
  ON mechanics FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_mechanics"
  ON mechanics FOR DELETE TO anon USING (true);

-- services
CREATE POLICY "anon_select_services"
  ON services FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_services"
  ON services FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_services"
  ON services FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_services"
  ON services FOR DELETE TO anon USING (true);

-- external_services
CREATE POLICY "anon_select_external_services"
  ON external_services FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_external_services"
  ON external_services FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_external_services"
  ON external_services FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_external_services"
  ON external_services FOR DELETE TO anon USING (true);

-- vehicles
CREATE POLICY "anon_select_vehicles"
  ON vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_vehicles"
  ON vehicles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_vehicles"
  ON vehicles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_vehicles"
  ON vehicles FOR DELETE TO anon USING (true);

-- bank_transaction_types
CREATE POLICY "anon_select_bank_transaction_types"
  ON bank_transaction_types FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_bank_transaction_types"
  ON bank_transaction_types FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_bank_transaction_types"
  ON bank_transaction_types FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bank_transaction_types"
  ON bank_transaction_types FOR DELETE TO anon USING (true);

-- bank_accounts
CREATE POLICY "anon_select_bank_accounts"
  ON bank_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_bank_accounts"
  ON bank_accounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_bank_accounts"
  ON bank_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bank_accounts"
  ON bank_accounts FOR DELETE TO anon USING (true);


-- ============================================================
-- REALTIME — enable publications for live listening
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'product_categories',
    'product_presentations',
    'products',
    'multimedia',
    'suppliers',
    'industries',
    'brands',
    'warehouses',
    'batches',
    'contacts',
    'customers',
    'mechanics',
    'services',
    'external_services',
    'vehicles',
    'bank_transaction_types',
    'bank_accounts'
  ] LOOP
    -- Add table to the supabase_realtime publication if not already present
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl);
    END IF;
  END LOOP;
END $$;
