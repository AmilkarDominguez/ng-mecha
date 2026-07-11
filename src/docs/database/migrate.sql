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


-- ============================================================
-- v11 — mechanics: agregar incorporated_at y retired_at
-- ============================================================
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS incorporated_at TIMESTAMPTZ;
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS retired_at      TIMESTAMPTZ;


-- ============================================================
-- v12 — Admin Module: eliminar valor MECHANIC de user_role_enum
-- ============================================================
-- PostgreSQL no permite eliminar valores de un ENUM directamente.
-- Se convierte la columna a TEXT, se elimina el tipo antiguo,
-- se recrea sin MECHANIC y se reconvierte la columna.
-- Los usuarios con rol MECHANIC pasan a INVENTORY de forma segura.
UPDATE users SET rol = 'INVENTORY' WHERE rol = 'MECHANIC';
ALTER TABLE users ALTER COLUMN rol TYPE TEXT;
DROP TYPE IF EXISTS user_role_enum;
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'SALES', 'INVENTORY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE users ALTER COLUMN rol TYPE user_role_enum USING rol::user_role_enum;


-- ============================================================
-- v13 — Inventory Module: agregar maps_url a suppliers
-- ============================================================
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS maps_url TEXT;


-- ============================================================
-- v14 — Workshop Module: agregar entry_date a mechanics
-- ============================================================
ALTER TABLE mechanics ADD COLUMN IF NOT EXISTS entry_date DATE;


-- ============================================================
-- v15 — Service Orders: mechanic_id pasa de service_order_services a service_orders
-- ============================================================
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS mechanic_id UUID REFERENCES mechanics(id) ON DELETE SET NULL;
ALTER TABLE service_order_services DROP COLUMN IF EXISTS mechanic_id;


-- ============================================================
-- v16 — Auth Module: seed de usuarios de prueba para login
-- ============================================================
-- NOTA: password en texto plano (mismo criterio usado hoy por el modulo Admin > Usuarios).
-- Cambiar/eliminar estos usuarios antes de pasar a produccion.
INSERT INTO users (name, lastname, email, password, allow_deletion, rol, state) VALUES
  ('Admin',      'Sistema', 'admin@mecha.test',     'Admin123!',     false, 'ADMIN',     'ACTIVE'),
  ('Ventas',     'Prueba',  'ventas@mecha.test',    'Ventas123!',    true,  'SALES',     'ACTIVE'),
  ('Inventario', 'Prueba',  'inventario@mecha.test','Inventario123!',true,  'INVENTORY', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- v17 — Auth Module: hash de contraseñas con pgcrypto (bcrypt)
-- ============================================================
-- pgcrypto ya esta habilitado (ver EXTENSIONS al inicio de tables.sql).

-- 1. Hashear cualquier password en texto plano ya existente (incluye el seed de v16).
UPDATE users
SET password = crypt(password, gen_salt('bf'))
WHERE password !~ '^\$2[aby]\$[0-9]{2}\$';

-- 2. Trigger: hashear automaticamente password en INSERT/UPDATE si llega en texto plano.
CREATE OR REPLACE FUNCTION hash_user_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.password IS NOT NULL AND NEW.password !~ '^\$2[aby]\$[0-9]{2}\$' THEN
    NEW.password := crypt(NEW.password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hash_user_password ON users;
CREATE TRIGGER trg_hash_user_password
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION hash_user_password();

-- 3. RPC de login: compara la contraseña con crypt() server-side y nunca
--    devuelve la columna password al cliente.
CREATE OR REPLACE FUNCTION login_user(p_email TEXT, p_password TEXT)
RETURNS TABLE (
  id             UUID,
  name           TEXT,
  lastname       TEXT,
  email          TEXT,
  allow_deletion BOOLEAN,
  rol            user_role_enum,
  state          state_enum,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT u.id, u.name, u.lastname, u.email, u.allow_deletion, u.rol, u.state, u.created_at, u.updated_at
  FROM users u
  WHERE u.email = p_email
    AND u.password = crypt(p_password, u.password)
    AND u.state = 'ACTIVE'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION login_user(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon, authenticated;


-- ============================================================
-- v18 — Accounts Module: crear tabla bank_account_histories
-- ============================================================
-- transaction_reference guarda el id de la entidad relacionada con el
-- movimiento (por ejemplo, service_orders.id para pagos de orden de
-- servicio). No es una FK formal: el campo es de referencia libre,
-- reutilizable por otros tipos de transaccion (depositos, retiros, etc.).
CREATE TABLE IF NOT EXISTS bank_account_histories (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id       UUID             REFERENCES bank_accounts(id)          ON DELETE SET NULL,
  user_id               UUID             REFERENCES users(id)                  ON DELETE SET NULL,
  transaction_type_id   UUID             REFERENCES bank_transaction_types(id) ON DELETE SET NULL,
  amount                NUMERIC(10,2),
  balance               NUMERIC(10,2),
  transaction_reference TEXT,
  concept               TEXT,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bah_bank_account_id ON bank_account_histories(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bah_transaction_reference ON bank_account_histories(transaction_reference);

DROP TRIGGER IF EXISTS trg_set_updated_at ON bank_account_histories;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON bank_account_histories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE bank_account_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_bank_account_histories" ON bank_account_histories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_bank_account_histories" ON bank_account_histories FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bank_account_histories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bank_account_histories;
  END IF;
END $$;


-- ============================================================
-- v19 — Service Orders: RPCs atomicas para pagos
-- ============================================================
-- Un pago toca 3 tablas (bank_account_histories, bank_accounts,
-- service_orders). Hacerlo con llamadas REST separadas desde el cliente
-- no es atomico: si una falla a mitad de camino, las demas ya se
-- aplicaron y el balance/saldo queda desincronizado. Estas funciones
-- ejecutan todo dentro de una sola transaccion de Postgres (mismo
-- patron que login_user en v17), con FOR UPDATE para evitar carreras
-- entre pagos concurrentes de la misma orden/cuenta.

CREATE OR REPLACE FUNCTION register_service_order_payment(
  p_service_order_id    UUID,
  p_bank_account_id     UUID,
  p_transaction_type_id UUID,
  p_amount              NUMERIC,
  p_concept             TEXT,
  p_user_id             UUID
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order       service_orders%ROWTYPE;
  v_account     bank_accounts%ROWTYPE;
  v_total_due   NUMERIC(10,2);
  v_new_have    NUMERIC(10,2);
  v_new_must    NUMERIC(10,2);
  v_new_balance NUMERIC(10,2);
  v_history     bank_account_histories%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_order FROM service_orders WHERE id = p_service_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de servicio no encontrada.';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  v_total_due := COALESCE(CASE WHEN v_order.with_iva THEN COALESCE(v_order.total_iva, v_order.total) ELSE v_order.total END, 0);

  IF p_amount > (v_total_due - COALESCE(v_order.have, 0) + 0.01) THEN
    RAISE EXCEPTION 'El monto supera el saldo pendiente de la orden.';
  END IF;

  v_new_have    := COALESCE(v_order.have, 0) + p_amount;
  v_new_must    := GREATEST(v_total_due - v_new_have, 0);
  v_new_balance := COALESCE(v_account.balance, 0) + p_amount;

  INSERT INTO bank_account_histories (
    bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept
  ) VALUES (
    p_bank_account_id, p_user_id, p_transaction_type_id, p_amount, v_new_balance, p_service_order_id::TEXT, p_concept
  ) RETURNING * INTO v_history;

  UPDATE bank_accounts SET balance = v_new_balance WHERE id = p_bank_account_id;
  UPDATE service_orders SET have = v_new_have, must = v_new_must WHERE id = p_service_order_id;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION register_service_order_payment(UUID, UUID, UUID, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_service_order_payment(UUID, UUID, UUID, NUMERIC, TEXT, UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION edit_service_order_payment(
  p_history_id      UUID,
  p_bank_account_id UUID,
  p_amount          NUMERIC,
  p_concept         TEXT
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history      bank_account_histories%ROWTYPE;
  v_order        service_orders%ROWTYPE;
  v_new_account  bank_accounts%ROWTYPE;
  v_total_due    NUMERIC(10,2);
  v_have_without NUMERIC(10,2);
  v_new_have     NUMERIC(10,2);
  v_new_must     NUMERIC(10,2);
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_history FROM bank_account_histories WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pago no encontrado.';
  END IF;

  SELECT * INTO v_order FROM service_orders WHERE id = v_history.transaction_reference::UUID FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de servicio no encontrada.';
  END IF;

  -- Bloquea ambas cuentas involucradas (actual y destino) en orden
  -- determinista por id para evitar deadlocks entre ediciones cruzadas.
  PERFORM 1 FROM bank_accounts WHERE id IN (v_history.bank_account_id, p_bank_account_id) ORDER BY id FOR UPDATE;

  v_total_due    := COALESCE(CASE WHEN v_order.with_iva THEN COALESCE(v_order.total_iva, v_order.total) ELSE v_order.total END, 0);
  v_have_without := COALESCE(v_order.have, 0) - COALESCE(v_history.amount, 0);

  IF p_amount > (v_total_due - v_have_without + 0.01) THEN
    RAISE EXCEPTION 'El monto supera el saldo pendiente de la orden.';
  END IF;

  v_new_have := v_have_without + p_amount;
  v_new_must := GREATEST(v_total_due - v_new_have, 0);

  IF p_bank_account_id = v_history.bank_account_id THEN
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) - COALESCE(v_history.amount, 0) + p_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  ELSE
    UPDATE bank_accounts SET balance = COALESCE(balance, 0) - COALESCE(v_history.amount, 0) WHERE id = v_history.bank_account_id;
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) + p_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;
  END IF;

  UPDATE bank_account_histories
    SET bank_account_id = p_bank_account_id,
        amount = p_amount,
        concept = p_concept,
        balance = v_new_account.balance
    WHERE id = p_history_id
    RETURNING * INTO v_history;

  UPDATE service_orders SET have = v_new_have, must = v_new_must WHERE id = v_order.id;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION edit_service_order_payment(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION edit_service_order_payment(UUID, UUID, NUMERIC, TEXT) TO anon, authenticated;


CREATE OR REPLACE FUNCTION delete_service_order_payment(p_history_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history   bank_account_histories%ROWTYPE;
  v_order     service_orders%ROWTYPE;
  v_account   bank_accounts%ROWTYPE;
  v_total_due NUMERIC(10,2);
  v_new_have  NUMERIC(10,2);
  v_new_must  NUMERIC(10,2);
BEGIN
  SELECT * INTO v_history FROM bank_account_histories WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pago no encontrado.';
  END IF;

  SELECT * INTO v_order FROM service_orders WHERE id = v_history.transaction_reference::UUID FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de servicio no encontrada.';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = v_history.bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  v_total_due := COALESCE(CASE WHEN v_order.with_iva THEN COALESCE(v_order.total_iva, v_order.total) ELSE v_order.total END, 0);
  v_new_have  := GREATEST(COALESCE(v_order.have, 0) - COALESCE(v_history.amount, 0), 0);
  v_new_must  := GREATEST(v_total_due - v_new_have, 0);

  DELETE FROM bank_account_histories WHERE id = p_history_id;
  UPDATE bank_accounts SET balance = COALESCE(balance, 0) - COALESCE(v_history.amount, 0) WHERE id = v_history.bank_account_id;
  UPDATE service_orders SET have = v_new_have, must = v_new_must WHERE id = v_order.id;
END;
$$;

REVOKE ALL ON FUNCTION delete_service_order_payment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_service_order_payment(UUID) TO anon, authenticated;


-- ============================================================
-- v20 — Inventory Module: bank_account_id en batches + RPCs
-- atomicas para la compra de lote (Compra lote de productos)
-- ============================================================
ALTER TABLE batches ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_batches_bank_account_id ON batches(bank_account_id);

-- Inserta el movimiento de egreso y descuenta el saldo. Se usa al crear un
-- lote con cuenta bancaria seleccionada, y tambien la reutiliza
-- reconcile_batch_purchase() cuando una edicion pasa de "sin cuenta" a
-- "con cuenta".
CREATE OR REPLACE FUNCTION apply_batch_purchase(
  p_batch_id        UUID,
  p_bank_account_id UUID,
  p_cost            NUMERIC,
  p_stock           NUMERIC,
  p_code            TEXT,
  p_user_id         UUID
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account bank_accounts%ROWTYPE;
  v_type_id UUID;
  v_amount  NUMERIC(10,2);
  v_history bank_account_histories%ROWTYPE;
BEGIN
  v_amount := COALESCE(p_cost, 0) * COALESCE(p_stock, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y el stock deben ser mayores a 0 para registrar la compra en la cuenta bancaria.';
  END IF;

  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Compra lote de productos' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el tipo de transaccion "Compra lote de productos".';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  UPDATE bank_accounts SET balance = COALESCE(balance, 0) - v_amount WHERE id = p_bank_account_id
    RETURNING balance INTO v_account.balance;

  INSERT INTO bank_account_histories (
    bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept
  ) VALUES (
    p_bank_account_id, p_user_id, v_type_id, v_amount, v_account.balance,
    p_batch_id::TEXT, 'Compra de lote' || CASE WHEN p_code IS NOT NULL AND p_code <> '' THEN ' ' || p_code ELSE '' END
  ) RETURNING * INTO v_history;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION apply_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Reconcilia el movimiento existente de un lote (si lo hay) contra el
-- estado actual del formulario tras una edicion. Cubre los 4 casos:
-- sin registro + sin cuenta (no-op), sin registro + nueva cuenta (crea),
-- con registro + cuenta removida (revierte y elimina), con registro +
-- cuenta igual o distinta (recalcula el monto y ajusta balances).
CREATE OR REPLACE FUNCTION reconcile_batch_purchase(
  p_batch_id        UUID,
  p_bank_account_id UUID,
  p_cost            NUMERIC,
  p_stock           NUMERIC,
  p_code            TEXT,
  p_user_id         UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing    bank_account_histories%ROWTYPE;
  v_type_id     UUID;
  v_amount      NUMERIC(10,2);
  v_old_account bank_accounts%ROWTYPE;
  v_new_account bank_accounts%ROWTYPE;
BEGIN
  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Compra lote de productos' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el tipo de transaccion "Compra lote de productos".';
  END IF;

  SELECT * INTO v_existing FROM bank_account_histories
    WHERE transaction_reference = p_batch_id::TEXT AND transaction_type_id = v_type_id
    FOR UPDATE;

  IF NOT FOUND AND p_bank_account_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT FOUND AND p_bank_account_id IS NOT NULL THEN
    PERFORM apply_batch_purchase(p_batch_id, p_bank_account_id, p_cost, p_stock, p_code, p_user_id);
    RETURN;
  END IF;

  IF FOUND AND p_bank_account_id IS NULL THEN
    -- v_existing.bank_account_id puede ser NULL si la cuenta original ya fue
    -- eliminada (ON DELETE SET NULL en bank_account_histories.bank_account_id):
    -- en ese caso no hay saldo que revertir, solo se limpia el registro.
    IF v_existing.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) WHERE id = v_existing.bank_account_id;
    END IF;
    DELETE FROM bank_account_histories WHERE id = v_existing.id;
    RETURN;
  END IF;

  -- Caso: habia un movimiento y sigue habiendo cuenta seleccionada (igual o
  -- distinta). Se valida explicitamente que la cuenta destino exista *antes*
  -- de tocar cualquier saldo (en vez de confiar solo en el FK de
  -- bank_account_histories.bank_account_id, que daria un error generico y
  -- dejaria ambiguo cual de las dos cuentas fallo).
  v_amount := COALESCE(p_cost, 0) * COALESCE(p_stock, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y el stock deben ser mayores a 0 para registrar la compra en la cuenta bancaria.';
  END IF;

  IF v_existing.bank_account_id IS NOT NULL AND v_existing.bank_account_id <> p_bank_account_id THEN
    -- Bloquea ambas cuentas (origen y destino) en una sola sentencia y en
    -- orden deterministico por id, para evitar deadlocks si otra
    -- reconciliacion concurrente intercambia las mismas dos cuentas en
    -- sentido opuesto (A<-B a la vez que B<-A).
    PERFORM 1 FROM bank_accounts WHERE id IN (v_existing.bank_account_id, p_bank_account_id) ORDER BY id FOR UPDATE;

    SELECT * INTO v_new_account FROM bank_accounts WHERE id = p_bank_account_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;

    -- v_old_account puede no encontrarse si la cuenta original ya fue
    -- eliminada (ON DELETE SET NULL); en ese caso no hay saldo previo que
    -- revertir, solo se aplica el nuevo egreso a la cuenta destino.
    SELECT * INTO v_old_account FROM bank_accounts WHERE id = v_existing.bank_account_id;
  ELSE
    SELECT * INTO v_new_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;
  END IF;

  IF v_existing.bank_account_id = p_bank_account_id THEN
    -- Misma cuenta: un solo movimiento neto. OJO CON EL SIGNO: esto es un
    -- EGRESO (registrarlo resta del balance), lo opuesto a un pago de orden
    -- de servicio (que es un INGRESO y suma). Revertir un egreso es SUMAR
    -- el monto anterior; aplicar el nuevo egreso es RESTAR el monto nuevo.
    -- Formula: balance + monto_anterior - monto_nuevo (NO al reves).
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) - v_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  ELSE
    -- Cuenta distinta: la cuenta anterior recupera su monto (si aun existe)
    -- y la cuenta destino descuenta el nuevo monto. Verifica al final que
    -- ambos saldos reflejen exactamente el delta esperado.
    IF v_old_account.id IS NOT NULL THEN
      UPDATE bank_accounts
        SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0)
        WHERE id = v_old_account.id
        RETURNING * INTO v_old_account;

      IF v_old_account.balance IS DISTINCT FROM NULL
         AND v_old_account.balance < 0
         AND COALESCE(v_existing.amount, 0) > 0 THEN
        RAISE WARNING 'La cuenta % quedo con saldo negativo (%) tras revertir un egreso.', v_old_account.id, v_old_account.balance;
      END IF;
    END IF;

    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) - v_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  END IF;

  UPDATE bank_account_histories
    SET bank_account_id = p_bank_account_id,
        amount = v_amount,
        balance = v_new_account.balance,
        concept = 'Compra de lote' || CASE WHEN p_code IS NOT NULL AND p_code <> '' THEN ' ' || p_code ELSE '' END
    WHERE id = v_existing.id;
END;
$$;

REVOKE ALL ON FUNCTION reconcile_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reconcile_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Revierte el movimiento de un lote (si existe) antes de eliminarlo, para
-- no dejar un egreso huerfano sin lote asociado.
CREATE OR REPLACE FUNCTION reverse_batch_purchase(p_batch_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing bank_account_histories%ROWTYPE;
  v_type_id  UUID;
BEGIN
  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Compra lote de productos' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_existing FROM bank_account_histories
    WHERE transaction_reference = p_batch_id::TEXT AND transaction_type_id = v_type_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) WHERE id = v_existing.bank_account_id;
  DELETE FROM bank_account_histories WHERE id = v_existing.id;
END;
$$;

REVOKE ALL ON FUNCTION reverse_batch_purchase(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reverse_batch_purchase(UUID) TO anon, authenticated;


-- ============================================================
-- v21 — Service Orders: RPCs atomicas para el egreso de
-- trabajos adicionales / servicios externos (Pago servicio externo)
-- ============================================================

-- Inserta el movimiento de egreso de UNA linea de service_order_external_services
-- y descuenta el saldo. Se llama una vez por cada linea con bank_account_id
-- seleccionado, tanto al crear la orden como al re-crear las lineas en una
-- edicion (ver reverse_external_service_expenses_for_order mas abajo).
CREATE OR REPLACE FUNCTION apply_external_service_expense(
  p_line_id         UUID,
  p_bank_account_id UUID,
  p_cost            NUMERIC,
  p_quantity        NUMERIC,
  p_concept         TEXT,
  p_user_id         UUID
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account bank_accounts%ROWTYPE;
  v_type_id UUID;
  v_amount  NUMERIC(10,2);
  v_history bank_account_histories%ROWTYPE;
BEGIN
  v_amount := COALESCE(p_cost, 0) * COALESCE(p_quantity, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y la cantidad deben ser mayores a 0 para registrar el egreso en la cuenta bancaria.';
  END IF;

  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Pago servicio externo' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro el tipo de transaccion "Pago servicio externo".';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  UPDATE bank_accounts SET balance = COALESCE(balance, 0) - v_amount WHERE id = p_bank_account_id
    RETURNING balance INTO v_account.balance;

  INSERT INTO bank_account_histories (
    bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept
  ) VALUES (
    p_bank_account_id, p_user_id, v_type_id, v_amount, v_account.balance,
    p_line_id::TEXT, p_concept
  ) RETURNING * INTO v_history;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION apply_external_service_expense(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_external_service_expense(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) TO anon, authenticated;

-- Revierte TODOS los movimientos de egreso de servicios externos de una
-- orden (busca por transaction_reference entre los ids de sus lineas
-- actuales) y los elimina. Debe llamarse ANTES de deleteLinesByOrderId,
-- mientras las lineas viejas todavia existen para poder encontrarlas.
CREATE OR REPLACE FUNCTION reverse_external_service_expenses_for_order(p_service_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_id UUID;
  v_row     RECORD;
BEGIN
  SELECT id INTO v_type_id FROM bank_transaction_types WHERE name = 'Pago servicio externo' AND type = 'EXPENSE' LIMIT 1;
  IF v_type_id IS NULL THEN
    RETURN;
  END IF;

  FOR v_row IN
    SELECT h.id AS history_id, h.bank_account_id, h.amount
    FROM bank_account_histories h
    WHERE h.transaction_type_id = v_type_id
      AND h.transaction_reference IN (
        SELECT id::TEXT FROM service_order_external_services WHERE service_order_id = p_service_order_id
      )
    FOR UPDATE OF h
  LOOP
    IF v_row.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_row.amount, 0) WHERE id = v_row.bank_account_id;
    END IF;
    DELETE FROM bank_account_histories WHERE id = v_row.history_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION reverse_external_service_expenses_for_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reverse_external_service_expenses_for_order(UUID) TO anon, authenticated;
