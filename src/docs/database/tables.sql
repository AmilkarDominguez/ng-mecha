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

-- Hash automatico de password (bcrypt via pgcrypto): si llega en texto plano
-- (INSERT o UPDATE desde el cliente) se hashea antes de guardarse. Si ya viene
-- hasheado (formato bcrypt $2a$/$2b$/$2y$) se deja intacto para no doble-hashear.
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

-- RPC de login: compara la contraseña con crypt() server-side y nunca
-- devuelve la columna password al cliente.
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

-- Seed: usuarios de prueba para el modulo de autenticacion.
-- El password se envia en texto plano aqui pero el trigger de arriba lo
-- hashea automaticamente antes de guardarse en la tabla.
-- Cambiar/eliminar estos usuarios antes de pasar a produccion.
INSERT INTO users (name, lastname, email, password, allow_deletion, rol, state) VALUES
  ('Admin',      'Sistema', 'admin@mecha.test',     'Admin123!',     false, 'ADMIN',     'ACTIVE'),
  ('Ventas',     'Prueba',  'ventas@mecha.test',    'Ventas123!',    true,  'SALES',     'ACTIVE'),
  ('Inventario', 'Prueba',  'inventario@mecha.test','Inventario123!',true,  'INVENTORY', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

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

-- batches.bank_account_id se agrega aqui (no en la definicion de la tabla
-- #9) porque bank_accounts todavia no existia en ese punto del script.
ALTER TABLE batches ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- 17b. bank_account_histories
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
  mechanic_id           UUID                 REFERENCES mechanics(id)          ON DELETE SET NULL,
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
-- Service Orders: RPCs atomicas para pagos
-- ============================================================
-- Un pago toca 3 tablas (bank_account_histories, bank_accounts,
-- service_orders). Hacerlo con llamadas REST separadas desde el cliente
-- no es atomico: si una falla a mitad de camino, las demas ya se
-- aplicaron y el balance/saldo queda desincronizado. Estas funciones
-- ejecutan todo dentro de una sola transaccion de Postgres (mismo
-- patron que login_user), con FOR UPDATE para evitar carreras entre
-- pagos concurrentes de la misma orden/cuenta.

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
-- Inventory: RPCs atomicas para la compra de lote (Compra lote
-- de productos) — bank_account_id en batches, ver ALTER arriba.
-- ============================================================

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
    IF v_existing.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) WHERE id = v_existing.bank_account_id;
    END IF;
    DELETE FROM bank_account_histories WHERE id = v_existing.id;
    RETURN;
  END IF;

  v_amount := COALESCE(p_cost, 0) * COALESCE(p_stock, 0);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'El costo y el stock deben ser mayores a 0 para registrar la compra en la cuenta bancaria.';
  END IF;

  IF v_existing.bank_account_id IS NOT NULL AND v_existing.bank_account_id <> p_bank_account_id THEN
    PERFORM 1 FROM bank_accounts WHERE id IN (v_existing.bank_account_id, p_bank_account_id) ORDER BY id FOR UPDATE;

    SELECT * INTO v_new_account FROM bank_accounts WHERE id = p_bank_account_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;

    SELECT * INTO v_old_account FROM bank_accounts WHERE id = v_existing.bank_account_id;
  ELSE
    SELECT * INTO v_new_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;
  END IF;

  IF v_existing.bank_account_id = p_bank_account_id THEN
    -- EGRESO: revertir el monto anterior es sumarlo, aplicar el nuevo es
    -- restarlo (al reves que un pago de orden de servicio, que es INGRESO).
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0) - v_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  ELSE
    IF v_old_account.id IS NOT NULL THEN
      UPDATE bank_accounts
        SET balance = COALESCE(balance, 0) + COALESCE(v_existing.amount, 0)
        WHERE id = v_old_account.id
        RETURNING * INTO v_old_account;
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
-- Service Orders: RPCs atomicas para el egreso de trabajos
-- adicionales / servicios externos (Pago servicio externo)
-- ============================================================

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
CREATE INDEX IF NOT EXISTS idx_batches_bank_account_id  ON batches(bank_account_id);
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
CREATE INDEX IF NOT EXISTS idx_bah_bank_account_id                  ON bank_account_histories(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bah_transaction_reference            ON bank_account_histories(transaction_reference);


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
    'bank_account_histories',
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
ALTER TABLE bank_account_histories             ENABLE ROW LEVEL SECURITY;
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

-- bank_account_histories
CREATE POLICY "auth_all_bank_account_histories"
  ON bank_account_histories FOR ALL TO authenticated USING (true) WITH CHECK (true);


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

-- bank_account_histories
CREATE POLICY "anon_all_bank_account_histories"
  ON bank_account_histories FOR ALL TO anon USING (true) WITH CHECK (true);


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
    'bank_accounts',
    'bank_account_histories'
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
