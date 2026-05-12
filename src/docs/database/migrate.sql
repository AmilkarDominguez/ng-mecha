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
-- v7 — Accounts Module: crear tabla bank_transaction_types
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
