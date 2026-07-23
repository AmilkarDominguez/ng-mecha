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


-- ============================================================
-- v22 — Quotes Module: cotizaciones, lineas, reserva de stock
-- (sin descontar batches.stock) y conversion a Orden de Servicio.
-- Diseno completo en .claude/commands/quote-module.md
-- ============================================================

DO $$ BEGIN
  CREATE TYPE quote_state_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_state_enum AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 22. quotes
CREATE TABLE IF NOT EXISTS quotes (
  id                          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                 UUID               NOT NULL REFERENCES customers(id)     ON DELETE RESTRICT,
  vehicle_id                  UUID               REFERENCES vehicles(id)                ON DELETE SET NULL,
  user_id                     UUID               REFERENCES users(id)                   ON DELETE SET NULL,
  converted_service_order_id  UUID               REFERENCES service_orders(id)          ON DELETE SET NULL,
  number                      TEXT,
  description                 TEXT,
  total                       NUMERIC(10,2),
  iva                         NUMERIC(10,2),
  total_iva                   NUMERIC(10,2),
  with_iva                    BOOLEAN            NOT NULL DEFAULT false,
  expiration_date             DATE,
  state                       quote_state_enum   NOT NULL DEFAULT 'PENDING',
  created_at                  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- 23. quote_services
CREATE TABLE IF NOT EXISTS quote_services (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID           NOT NULL REFERENCES quotes(id)  ON DELETE CASCADE,
  service_id  UUID           REFERENCES services(id)          ON DELETE SET NULL,
  discount    NUMERIC(8,2),
  price       NUMERIC(8,2),
  quantity    NUMERIC,
  subtotal    NUMERIC(8,2),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 24. quote_batches
CREATE TABLE IF NOT EXISTS quote_batches (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id       UUID                 NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  batch_id       UUID                 REFERENCES batches(id)          ON DELETE SET NULL,
  description    TEXT,
  delivery_time  delivery_time_enum   NOT NULL DEFAULT 'IMMEDIATE',
  quantity       NUMERIC,
  price          NUMERIC(8,2),
  discount       NUMERIC(8,2),
  subtotal       NUMERIC(8,2),
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- 25. quote_external_services
CREATE TABLE IF NOT EXISTS quote_external_services (
  id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id             UUID             NOT NULL REFERENCES quotes(id)           ON DELETE CASCADE,
  external_service_id  UUID             REFERENCES external_services(id)         ON DELETE SET NULL,
  cost                 NUMERIC(8,2),
  price                NUMERIC(8,2),
  quantity             NUMERIC,
  subtotal             NUMERIC(8,2),
  created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 26. batch_reservations — no tiene CRUD de usuario, solo la tocan las RPCs de abajo
CREATE TABLE IF NOT EXISTS batch_reservations (
  id              UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_batch_id  UUID                     NOT NULL REFERENCES quote_batches(id) ON DELETE CASCADE,
  batch_id        UUID                     NOT NULL REFERENCES batches(id)       ON DELETE RESTRICT,
  quantity        NUMERIC                  NOT NULL,
  reserved_until  DATE                     NOT NULL,
  state           reservation_state_enum   NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

-- quote_id de trazabilidad (nullable) en las 3 tablas pivote de Orden de Servicio.
-- No hay quote_id de cabecera en service_orders — ver nota en entities.md.
ALTER TABLE service_order_services          ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE service_order_batches           ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE service_order_external_services ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

-- Vista: stock disponible = stock fisico - reservas activas de cotizaciones
-- vigentes - compromisos de ordenes ya en curso. batches.stock NUNCA se
-- descuenta por cotizaciones ni por ordenes (ver quote-module.md #5).
CREATE OR REPLACE VIEW batch_available_stock AS
SELECT
  b.id AS batch_id,
  b.stock,
  COALESCE(b.stock, 0)
    - COALESCE((
        SELECT SUM(r.quantity) FROM batch_reservations r
        WHERE r.batch_id = b.id AND r.state = 'ACTIVE' AND r.reserved_until >= CURRENT_DATE
      ), 0)
    - COALESCE((
        SELECT SUM(sob.quantity) FROM service_order_batches sob
        JOIN service_orders so ON so.id = sob.service_order_id
        WHERE sob.batch_id = b.id AND so.state = 'IN_PROGRESS'
      ), 0) AS available_stock
FROM batches b;

GRANT SELECT ON batch_available_stock TO anon, authenticated;

-- ============================================================
-- Quotes: RPCs atomicas (reserva / liberacion / conversion)
-- ============================================================

-- Aprueba una cotizacion PENDING: reserva stock (FOR UPDATE por lote,
-- orden deterministico por batch_id para evitar deadlocks) de sus lineas
-- IMMEDIATE con batch_id no nulo. Si algun lote no tiene disponibilidad
-- suficiente, aborta toda la aprobacion (ninguna reserva parcial).
CREATE OR REPLACE FUNCTION reserve_quote_batches(p_quote_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote        quotes%ROWTYPE;
  v_line         RECORD;
  v_batch        batches%ROWTYPE;
  v_available    NUMERIC;
  v_product_name TEXT;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotizacion no encontrada.';
  END IF;
  IF v_quote.state <> 'PENDING' THEN
    RAISE EXCEPTION 'Solo se puede aprobar una cotizacion en estado Pendiente.';
  END IF;
  IF v_quote.expiration_date IS NULL OR v_quote.expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'La cotizacion debe tener una fecha de vencimiento valida (hoy o posterior) para poder aprobarse.';
  END IF;

  FOR v_line IN
    SELECT qb.id, qb.batch_id, qb.quantity
    FROM quote_batches qb
    WHERE qb.quote_id = p_quote_id
      AND qb.delivery_time = 'IMMEDIATE'
      AND qb.batch_id IS NOT NULL
    ORDER BY qb.batch_id
  LOOP
    SELECT * INTO v_batch FROM batches WHERE id = v_line.batch_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Repuesto no encontrado.';
    END IF;

    v_available := COALESCE(v_batch.stock, 0)
      - COALESCE((SELECT SUM(r.quantity) FROM batch_reservations r WHERE r.batch_id = v_batch.id AND r.state = 'ACTIVE' AND r.reserved_until >= CURRENT_DATE), 0)
      - COALESCE((SELECT SUM(sob.quantity) FROM service_order_batches sob JOIN service_orders so ON so.id = sob.service_order_id WHERE sob.batch_id = v_batch.id AND so.state = 'IN_PROGRESS'), 0);

    IF COALESCE(v_line.quantity, 0) > v_available THEN
      SELECT p.name INTO v_product_name FROM products p WHERE p.id = v_batch.product_id;
      RAISE EXCEPTION 'Stock insuficiente para "%": disponible %, solicitado %.',
        COALESCE(v_product_name, v_batch.code, v_batch.id::TEXT), v_available, v_line.quantity;
    END IF;

    INSERT INTO batch_reservations (quote_batch_id, batch_id, quantity, reserved_until, state)
    VALUES (v_line.id, v_batch.id, v_line.quantity, v_quote.expiration_date, 'ACTIVE');
  END LOOP;

  UPDATE quotes SET state = 'APPROVED' WHERE id = p_quote_id;
END;
$$;

REVOKE ALL ON FUNCTION reserve_quote_batches(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_quote_batches(UUID) TO anon, authenticated;

-- Libera las reservas activas de una cotizacion y la mueve al estado
-- indicado (REJECTED, CANCELED o EXPIRED). Una cotizacion PENDING sin
-- reservas puede rechazarse/anularse con un UPDATE directo sin pasar por
-- aqui (no tiene nada que liberar).
CREATE OR REPLACE FUNCTION release_quote_reservations(p_quote_id UUID, p_target_state TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote              quotes%ROWTYPE;
  v_reservation_state  reservation_state_enum;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotizacion no encontrada.';
  END IF;

  v_reservation_state := CASE WHEN p_target_state = 'EXPIRED' THEN 'EXPIRED'::reservation_state_enum ELSE 'RELEASED'::reservation_state_enum END;

  UPDATE batch_reservations
    SET state = v_reservation_state
    WHERE quote_batch_id IN (SELECT id FROM quote_batches WHERE quote_id = p_quote_id)
      AND state = 'ACTIVE';

  UPDATE quotes SET state = p_target_state::quote_state_enum WHERE id = p_quote_id;
END;
$$;

REVOKE ALL ON FUNCTION release_quote_reservations(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION release_quote_reservations(UUID, TEXT) TO anon, authenticated;

-- Convierte una cotizacion APPROVED completa hacia una orden de servicio
-- (nueva o ya IN_PROGRESS): copia sus 3 tipos de linea con quote_id de
-- trazabilidad, consume sus reservas, y recalcula el total de la orden
-- desde cero (suma de TODAS sus lineas, no un delta incremental) para
-- que convertir una segunda cotizacion sobre una orden ya abierta nunca
-- desincronice el total.
CREATE OR REPLACE FUNCTION convert_quote_to_order(p_quote_id UUID, p_service_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote     quotes%ROWTYPE;
  v_order     service_orders%ROWTYPE;
  v_total     NUMERIC(10,2);
  v_iva       NUMERIC(10,2);
  v_total_iva NUMERIC(10,2);
  v_must      NUMERIC(10,2);
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotizacion no encontrada.';
  END IF;
  IF v_quote.state <> 'APPROVED' THEN
    RAISE EXCEPTION 'Solo se puede convertir una cotizacion en estado Aprobada.';
  END IF;

  SELECT * INTO v_order FROM service_orders WHERE id = p_service_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de servicio no encontrada.';
  END IF;

  INSERT INTO service_order_services (service_order_id, quote_id, service_id, discount, price, quantity, subtotal)
  SELECT p_service_order_id, p_quote_id, service_id, discount, price, quantity, subtotal
  FROM quote_services WHERE quote_id = p_quote_id;

  INSERT INTO service_order_batches (service_order_id, quote_id, batch_id, quantity, delivery_time, price, discount, subtotal)
  SELECT p_service_order_id, p_quote_id, batch_id, quantity, delivery_time, price, discount, subtotal
  FROM quote_batches WHERE quote_id = p_quote_id;

  INSERT INTO service_order_external_services (service_order_id, quote_id, external_service_id, cost, price, quantity, subtotal)
  SELECT p_service_order_id, p_quote_id, external_service_id, cost, price, quantity, subtotal
  FROM quote_external_services WHERE quote_id = p_quote_id;

  UPDATE batch_reservations
    SET state = 'CONSUMED'
    WHERE quote_batch_id IN (SELECT id FROM quote_batches WHERE quote_id = p_quote_id)
      AND state = 'ACTIVE';

  SELECT
    COALESCE((SELECT SUM(subtotal) FROM service_order_services WHERE service_order_id = p_service_order_id), 0)
    + COALESCE((SELECT SUM(subtotal) FROM service_order_batches WHERE service_order_id = p_service_order_id), 0)
    + COALESCE((SELECT SUM(subtotal) FROM service_order_external_services WHERE service_order_id = p_service_order_id), 0)
  INTO v_total;

  v_iva       := CASE WHEN v_order.with_iva THEN v_total * 0.13 ELSE 0 END;
  v_total_iva := v_total + v_iva;
  v_must      := GREATEST((CASE WHEN v_order.with_iva THEN v_total_iva ELSE v_total END) - COALESCE(v_order.have, 0), 0);

  UPDATE service_orders
    SET total = v_total, iva = v_iva, total_iva = v_total_iva, must = v_must
    WHERE id = p_service_order_id;

  UPDATE quotes SET state = 'CONVERTED', converted_service_order_id = p_service_order_id WHERE id = p_quote_id;
END;
$$;

REVOKE ALL ON FUNCTION convert_quote_to_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION convert_quote_to_order(UUID, UUID) TO anon, authenticated;

-- Resolucion perezosa de vencimientos (no hay cron en el proyecto): se
-- invoca best-effort desde SPQuote al cargar el dashboard de Cotizaciones.
CREATE OR REPLACE FUNCTION expire_overdue_quote_reservations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  FOR v_quote_id IN
    SELECT id FROM quotes WHERE state = 'APPROVED' AND expiration_date < CURRENT_DATE FOR UPDATE
  LOOP
    UPDATE batch_reservations
      SET state = 'EXPIRED'
      WHERE quote_batch_id IN (SELECT id FROM quote_batches WHERE quote_id = v_quote_id)
        AND state = 'ACTIVE';
    UPDATE quotes SET state = 'EXPIRED' WHERE id = v_quote_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION expire_overdue_quote_reservations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION expire_overdue_quote_reservations() TO anon, authenticated;

-- Indices
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id                ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id                 ON quotes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_state                      ON quotes(state);
CREATE INDEX IF NOT EXISTS idx_quotes_converted_service_order_id ON quotes(converted_service_order_id);
CREATE INDEX IF NOT EXISTS idx_quote_services_quote_id           ON quote_services(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_batches_quote_id            ON quote_batches(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_batches_batch_id            ON quote_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_quote_external_services_quote_id  ON quote_external_services(quote_id);
CREATE INDEX IF NOT EXISTS idx_batch_reservations_quote_batch_id ON batch_reservations(quote_batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_reservations_batch_id       ON batch_reservations(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_reservations_state          ON batch_reservations(state);
CREATE INDEX IF NOT EXISTS idx_sos_quote_id ON service_order_services(quote_id);
CREATE INDEX IF NOT EXISTS idx_sob_quote_id ON service_order_batches(quote_id);
CREATE INDEX IF NOT EXISTS idx_soe_quote_id ON service_order_external_services(quote_id);

-- Trigger set_updated_at para las 5 tablas nuevas
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'quotes',
    'quote_services',
    'quote_batches',
    'quote_external_services',
    'batch_reservations'
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

-- RLS
ALTER TABLE quotes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_services          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_batches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_reservations      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_quotes"                  ON quotes                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quote_services"          ON quote_services          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quote_batches"           ON quote_batches           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quote_external_services" ON quote_external_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_batch_reservations"      ON batch_reservations      FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_quotes"                  ON quotes                  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_services"          ON quote_services          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_batches"           ON quote_batches           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_external_services" ON quote_external_services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_batch_reservations"      ON batch_reservations      FOR ALL TO anon USING (true) WITH CHECK (true);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'quotes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE quotes;
  END IF;
END $$;


-- ============================================================
-- v23 — Admin Module: crear tabla workshop_settings (Configuracion del sistema)
-- ============================================================
-- Entidad singleton: una sola fila para todo el sistema, con los datos de
-- la empresa (nombre, logo, contacto, redes) que alimentan los documentos
-- impresos (Hoja de Servicios, Cotizacion), hoy hardcodeados y duplicados
-- en service-order-print-modal.html y quote-print-modal.html.
-- La columna "singleton" + su UNIQUE + CHECK impiden que exista una
-- segunda fila.
CREATE TABLE IF NOT EXISTS workshop_settings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton         BOOLEAN     NOT NULL DEFAULT true,
  name              TEXT        NOT NULL,
  slogan            TEXT,
  email             TEXT,
  address           TEXT,
  contact_phone_1   TEXT,
  contact_phone_2   TEXT,
  facebook_url      TEXT,
  instagram_url     TEXT,
  website_url       TEXT,
  tiktok_url        TEXT,
  extra_url_1       TEXT,
  extra_url_2       TEXT,
  next_order_number INTEGER,
  logo_url          TEXT,
  show_in_print     BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workshop_settings_singleton_unique UNIQUE (singleton),
  CONSTRAINT workshop_settings_singleton_true CHECK (singleton)
);

INSERT INTO workshop_settings (
  name, slogan, email, address, contact_phone_1, contact_phone_2,
  facebook_url, instagram_url, website_url, tiktok_url, next_order_number, show_in_print
) VALUES (
  'Macatrónica',
  'ESPECIALIZADOS EN TU VEHÍCULO, PRIORIZANDO TU VIDA',
  'mecatronica.t.m.e@gmail.com',
  'Barrio San Jorge 1 Sobre Av. Panamericana Una Cuadra Y Media Antes De La Rotonda De La Coca Cola.',
  '68710817',
  '00000000',
  'www.facebook.com/DIRTYRACINGTARIJA',
  'www.instagram.com/taller_mecatronica_',
  'www.tallermacatronica.com',
  'www.tiktok.com/@taller_mecanico_electro',
  1001,
  true
)
ON CONFLICT (singleton) DO NOTHING;

-- Bucket de Storage para el logo del taller (primer bucket usado en el proyecto).
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-logo', 'workshop-logo', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_workshop_logo" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'workshop-logo');
CREATE POLICY "auth_write_workshop_logo" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'workshop-logo');
CREATE POLICY "auth_update_workshop_logo" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'workshop-logo');
CREATE POLICY "anon_write_workshop_logo" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'workshop-logo');
CREATE POLICY "anon_update_workshop_logo" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'workshop-logo');

DROP TRIGGER IF EXISTS trg_set_updated_at ON workshop_settings;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON workshop_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workshop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_workshop_settings" ON workshop_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_workshop_settings" ON workshop_settings FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workshop_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workshop_settings;
  END IF;
END $$;
