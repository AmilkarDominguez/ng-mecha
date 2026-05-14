-- ============================================================
-- Mecha Sys — Migrations (non-destructive)
-- Database: Supabase (PostgreSQL)
-- Aplica cambios estructurales sin eliminar datos existentes.
-- ============================================================


-- ============================================================
-- v1 — suppliers: agregar nit y phone
-- ============================================================
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS nit   TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone TEXT;


-- ============================================================
-- v2 — batches: renombrar brand → compatible_brands, model → compatible_models
-- ============================================================
ALTER TABLE batches RENAME COLUMN brand TO compatible_brands;
ALTER TABLE batches RENAME COLUMN model TO compatible_models;


-- ============================================================
-- v3 — batches: centralizar precios → eliminar wholesale_price,
--      retail_price, final_price; agregar cost y price
-- ============================================================
ALTER TABLE batches DROP   COLUMN IF EXISTS wholesale_price;
ALTER TABLE batches DROP   COLUMN IF EXISTS retail_price;
ALTER TABLE batches DROP   COLUMN IF EXISTS final_price;
ALTER TABLE batches ADD    COLUMN IF NOT EXISTS cost  NUMERIC(10,2);
ALTER TABLE batches ADD    COLUMN IF NOT EXISTS price NUMERIC(10,2);


-- ============================================================
-- v4 — customers: eliminar expedition_ci, code_ci y email;
--      agregar rating (customer_rating_enum)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE customer_rating_enum AS ENUM ('GOOD', 'REGULAR', 'BAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE customers DROP COLUMN IF EXISTS expedition_ci;
ALTER TABLE customers DROP COLUMN IF EXISTS code_ci;
ALTER TABLE customers DROP COLUMN IF EXISTS email;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS rating customer_rating_enum;


-- ============================================================
-- v5 — external_services: agregar address, phone, rating
-- ============================================================
DO $$ BEGIN
  CREATE TYPE external_services_rating_enum AS ENUM ('GOOD', 'REGULAR', 'BAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE external_services ADD COLUMN IF NOT EXISTS address      TEXT;
ALTER TABLE external_services ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE external_services ADD COLUMN IF NOT EXISTS rating       external_services_rating_enum;


-- ============================================================
-- v6 — external_services: agregar company_name
-- ============================================================
ALTER TABLE external_services ADD COLUMN IF NOT EXISTS company_name TEXT;


-- ============================================================
-- v7 — mechanics: eliminar expedition_ci y code_ci
-- ============================================================
ALTER TABLE mechanics DROP COLUMN IF EXISTS expedition_ci;
ALTER TABLE mechanics DROP COLUMN IF EXISTS code_ci;


-- ============================================================
-- v8 — Accounts Module: crear tabla bank_transaction_types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE bank_transaction_kind AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DROP TRIGGER IF EXISTS trg_set_updated_at ON bank_transaction_types;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON bank_transaction_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE bank_transaction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_bank_transaction_types"
  ON bank_transaction_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_transaction_types"
  ON bank_transaction_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_transaction_types"
  ON bank_transaction_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_bank_transaction_types"
  ON bank_transaction_types FOR DELETE TO authenticated USING (true);

CREATE POLICY "anon_select_bank_transaction_types"
  ON bank_transaction_types FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_bank_transaction_types"
  ON bank_transaction_types FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_bank_transaction_types"
  ON bank_transaction_types FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bank_transaction_types"
  ON bank_transaction_types FOR DELETE TO anon USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bank_transaction_types'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bank_transaction_types;
  END IF;
END $$;

-- Seed: registros por defecto (idempotente)
INSERT INTO bank_transaction_types (name, description, type, allow_deletion, state) VALUES
  ('Creación de cuenta bancaria',  'Creación de cuenta bancaria.',  'INCOME',  false, 'ACTIVE'),
  ('Depósito a cuenta bancaria',   'Depósito a cuenta bancaria.',   'INCOME',  false, 'ACTIVE'),
  ('Retiro de cuenta bancaria',    'Retiro de cuenta bancaria.',    'EXPENSE', false, 'ACTIVE'),
  ('Compra lote de productos',     'Compra lote de productos.',     'EXPENSE', false, 'ACTIVE'),
  ('Pago de orden de servicio',    'Pago de orden de servicio.',    'INCOME',  false, 'ACTIVE'),
  ('Pago servicio externo',        'Pago servicio externo.',        'EXPENSE', false, 'ACTIVE')
ON CONFLICT DO NOTHING;


-- ============================================================
-- v8 — Accounts Module: crear tabla bank_accounts
-- ============================================================
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

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at ON bank_accounts;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_bank_accounts"
  ON bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_bank_accounts"
  ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_accounts"
  ON bank_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_bank_accounts"
  ON bank_accounts FOR DELETE TO authenticated USING (true);

CREATE POLICY "anon_select_bank_accounts"
  ON bank_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_bank_accounts"
  ON bank_accounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_bank_accounts"
  ON bank_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bank_accounts"
  ON bank_accounts FOR DELETE TO anon USING (true);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bank_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
  END IF;
END $$;


-- ============================================================
-- v9 — Admin Module: crear tabla users
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'SALES', 'INVENTORY', 'MECHANIC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

DROP TRIGGER IF EXISTS trg_set_updated_at ON users;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_users"
  ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_users"
  ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_users"
  ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_users"
  ON users FOR DELETE TO authenticated USING (true);

CREATE POLICY "anon_select_users"
  ON users FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_users"
  ON users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_users"
  ON users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_users"
  ON users FOR DELETE TO anon USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END $$;


-- ============================================================
-- v10 — Service Orders Module: crear tablas service_orders y tablas pivote
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id      ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_vehicle_id       ON service_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_state            ON service_orders(state);
CREATE INDEX IF NOT EXISTS idx_so_services_order_id            ON service_order_services(service_order_id);
CREATE INDEX IF NOT EXISTS idx_so_batches_order_id             ON service_order_batches(service_order_id);
CREATE INDEX IF NOT EXISTS idx_so_external_order_id            ON service_order_external_services(service_order_id);

-- Triggers
DROP TRIGGER IF EXISTS trg_set_updated_at ON service_orders;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON service_order_services;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON service_order_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON service_order_batches;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON service_order_batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at ON service_order_external_services;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON service_order_external_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE service_orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_batches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_external_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_service_orders" ON service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_service_orders" ON service_orders FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_so_services" ON service_order_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_so_services" ON service_order_services FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_so_batches" ON service_order_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_so_batches" ON service_order_batches FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_so_external" ON service_order_external_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_so_external" ON service_order_external_services FOR ALL TO anon USING (true) WITH CHECK (true);

-- Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'service_orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_orders;
  END IF;
END $$;
