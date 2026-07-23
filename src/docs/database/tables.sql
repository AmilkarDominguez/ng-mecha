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

-- 0bis. workshop_settings (Admin Module)
-- Entidad singleton: una sola fila para todo el sistema (datos de la
-- empresa que alimentan los documentos impresos). "singleton" + su UNIQUE
-- + CHECK garantizan que nunca exista una segunda fila.
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

-- Seed: fila unica con los datos actuales del taller.
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

-- Trigger, RLS y realtime de workshop_settings se registran junto con el
-- resto de tablas en las secciones centralizadas al final de este archivo
-- (no inline aqui) — mismo patron que bank_account_histories/quotes/service_orders.

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

DO $$ BEGIN
  CREATE TYPE quote_state_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_state_enum AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');
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
-- Quotes Module — diseno completo en .claude/commands/quote-module.md
-- ============================================================

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

-- quote_id de trazabilidad (nullable) en las 3 tablas pivote de Orden de
-- Servicio. No hay quote_id de cabecera en service_orders (ver entities.md).
ALTER TABLE service_order_services          ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE service_order_batches           ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE service_order_external_services ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

-- Vista: stock disponible = stock fisico - reservas activas de cotizaciones
-- vigentes - compromisos de ordenes ya en curso. batches.stock NUNCA se
-- descuenta por cotizaciones ni por ordenes.
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
-- Accounts: RPCs atomicas para el registro manual de ingresos
-- (deposito u otro tipo INCOME que no pertenezca a otro flujo,
-- ej. "Pago de orden de servicio"). Mismo patron que los pagos
-- de orden de servicio: 1 transaccion, FOR UPDATE, ajusta
-- bank_accounts.balance sin calculos en el cliente.
-- ============================================================

CREATE OR REPLACE FUNCTION register_bank_income(
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
  v_account     bank_accounts%ROWTYPE;
  v_type        bank_transaction_types%ROWTYPE;
  v_new_balance NUMERIC(10,2);
  v_history     bank_account_histories%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  SELECT * INTO v_type FROM bank_transaction_types WHERE id = p_transaction_type_id;
  IF NOT FOUND OR v_type.type <> 'INCOME' THEN
    RAISE EXCEPTION 'El tipo de transaccion debe ser un ingreso valido.';
  END IF;

  v_new_balance := COALESCE(v_account.balance, 0) + p_amount;

  -- transaction_reference NULL: es un ingreso manual, no esta ligado a
  -- una orden de servicio ni a ningun otro registro.
  INSERT INTO bank_account_histories (
    bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept
  ) VALUES (
    p_bank_account_id, p_user_id, p_transaction_type_id, p_amount, v_new_balance, NULL, p_concept
  ) RETURNING * INTO v_history;

  UPDATE bank_accounts SET balance = v_new_balance WHERE id = p_bank_account_id;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION register_bank_income(UUID, UUID, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_bank_income(UUID, UUID, NUMERIC, TEXT, UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION edit_bank_income(
  p_history_id          UUID,
  p_bank_account_id     UUID,
  p_transaction_type_id UUID,
  p_amount              NUMERIC,
  p_concept             TEXT
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history     bank_account_histories%ROWTYPE;
  v_type        bank_transaction_types%ROWTYPE;
  v_new_account bank_accounts%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_history FROM bank_account_histories WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingreso no encontrado.';
  END IF;

  IF v_history.transaction_reference IS NOT NULL THEN
    RAISE EXCEPTION 'Este movimiento pertenece a otro proceso y no se puede editar desde aqui.';
  END IF;

  SELECT * INTO v_type FROM bank_transaction_types WHERE id = p_transaction_type_id;
  IF NOT FOUND OR v_type.type <> 'INCOME' THEN
    RAISE EXCEPTION 'El tipo de transaccion debe ser un ingreso valido.';
  END IF;

  -- Bloquea ambas cuentas involucradas (actual y destino) en orden
  -- deterministico por id para evitar deadlocks entre ediciones cruzadas.
  PERFORM 1 FROM bank_accounts WHERE id IN (v_history.bank_account_id, p_bank_account_id) ORDER BY id FOR UPDATE;

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
        transaction_type_id = p_transaction_type_id,
        amount = p_amount,
        concept = p_concept,
        balance = v_new_account.balance
    WHERE id = p_history_id
    RETURNING * INTO v_history;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION edit_bank_income(UUID, UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION edit_bank_income(UUID, UUID, UUID, NUMERIC, TEXT) TO anon, authenticated;


CREATE OR REPLACE FUNCTION delete_bank_income(p_history_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history bank_account_histories%ROWTYPE;
BEGIN
  SELECT * INTO v_history FROM bank_account_histories WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingreso no encontrado.';
  END IF;

  IF v_history.transaction_reference IS NOT NULL THEN
    RAISE EXCEPTION 'Este movimiento pertenece a otro proceso y no se puede eliminar desde aqui.';
  END IF;

  PERFORM 1 FROM bank_accounts WHERE id = v_history.bank_account_id FOR UPDATE;

  DELETE FROM bank_account_histories WHERE id = p_history_id;
  UPDATE bank_accounts SET balance = COALESCE(balance, 0) - COALESCE(v_history.amount, 0) WHERE id = v_history.bank_account_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_bank_income(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_bank_income(UUID) TO anon, authenticated;


-- ============================================================
-- Accounts: RPCs atomicas para el registro manual de egresos
-- (retiro u otro tipo EXPENSE que no pertenezca a otro flujo, ej.
-- "Compra lote de productos" / "Pago servicio externo"). Espejo
-- de register/edit/delete_bank_income, restando en vez de sumar.
-- ============================================================

CREATE OR REPLACE FUNCTION register_bank_expense(
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
  v_account     bank_accounts%ROWTYPE;
  v_type        bank_transaction_types%ROWTYPE;
  v_new_balance NUMERIC(10,2);
  v_history     bank_account_histories%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_account FROM bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta bancaria no encontrada.';
  END IF;

  SELECT * INTO v_type FROM bank_transaction_types WHERE id = p_transaction_type_id;
  IF NOT FOUND OR v_type.type <> 'EXPENSE' THEN
    RAISE EXCEPTION 'El tipo de transaccion debe ser un egreso valido.';
  END IF;

  v_new_balance := COALESCE(v_account.balance, 0) - p_amount;

  -- transaction_reference NULL: es un egreso manual, no esta ligado a
  -- una orden de servicio, lote ni a ningun otro registro.
  INSERT INTO bank_account_histories (
    bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept
  ) VALUES (
    p_bank_account_id, p_user_id, p_transaction_type_id, p_amount, v_new_balance, NULL, p_concept
  ) RETURNING * INTO v_history;

  UPDATE bank_accounts SET balance = v_new_balance WHERE id = p_bank_account_id;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION register_bank_expense(UUID, UUID, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_bank_expense(UUID, UUID, NUMERIC, TEXT, UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION edit_bank_expense(
  p_history_id          UUID,
  p_bank_account_id     UUID,
  p_transaction_type_id UUID,
  p_amount              NUMERIC,
  p_concept             TEXT
)
RETURNS bank_account_histories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history     bank_account_histories%ROWTYPE;
  v_type        bank_transaction_types%ROWTYPE;
  v_new_account bank_accounts%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_history FROM bank_account_histories WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Egreso no encontrado.';
  END IF;

  IF v_history.transaction_reference IS NOT NULL THEN
    RAISE EXCEPTION 'Este movimiento pertenece a otro proceso y no se puede editar desde aqui.';
  END IF;

  SELECT * INTO v_type FROM bank_transaction_types WHERE id = p_transaction_type_id;
  IF NOT FOUND OR v_type.type <> 'EXPENSE' THEN
    RAISE EXCEPTION 'El tipo de transaccion debe ser un egreso valido.';
  END IF;

  -- Bloquea ambas cuentas involucradas (actual y destino) en orden
  -- deterministico por id para evitar deadlocks entre ediciones cruzadas.
  PERFORM 1 FROM bank_accounts WHERE id IN (v_history.bank_account_id, p_bank_account_id) ORDER BY id FOR UPDATE;

  IF p_bank_account_id = v_history.bank_account_id THEN
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) + COALESCE(v_history.amount, 0) - p_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
  ELSE
    UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_history.amount, 0) WHERE id = v_history.bank_account_id;
    UPDATE bank_accounts
      SET balance = COALESCE(balance, 0) - p_amount
      WHERE id = p_bank_account_id
      RETURNING * INTO v_new_account;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cuenta bancaria destino no encontrada.';
    END IF;
  END IF;

  UPDATE bank_account_histories
    SET bank_account_id = p_bank_account_id,
        transaction_type_id = p_transaction_type_id,
        amount = p_amount,
        concept = p_concept,
        balance = v_new_account.balance
    WHERE id = p_history_id
    RETURNING * INTO v_history;

  RETURN v_history;
END;
$$;

REVOKE ALL ON FUNCTION edit_bank_expense(UUID, UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION edit_bank_expense(UUID, UUID, UUID, NUMERIC, TEXT) TO anon, authenticated;


CREATE OR REPLACE FUNCTION delete_bank_expense(p_history_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history bank_account_histories%ROWTYPE;
BEGIN
  SELECT * INTO v_history FROM bank_account_histories WHERE id = p_history_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Egreso no encontrado.';
  END IF;

  IF v_history.transaction_reference IS NOT NULL THEN
    RAISE EXCEPTION 'Este movimiento pertenece a otro proceso y no se puede eliminar desde aqui.';
  END IF;

  PERFORM 1 FROM bank_accounts WHERE id = v_history.bank_account_id FOR UPDATE;

  DELETE FROM bank_account_histories WHERE id = p_history_id;
  UPDATE bank_accounts SET balance = COALESCE(balance, 0) + COALESCE(v_history.amount, 0) WHERE id = v_history.bank_account_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_bank_expense(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_bank_expense(UUID) TO anon, authenticated;


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
    'workshop_settings',
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
    'service_order_external_services',
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


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_settings      ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE quotes                             ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_services                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_batches                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_external_services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_reservations                 ENABLE ROW LEVEL SECURITY;


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

-- workshop_settings
CREATE POLICY "auth_all_workshop_settings"
  ON workshop_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- bank_account_histories
CREATE POLICY "auth_all_bank_account_histories"
  ON bank_account_histories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service Orders Module
CREATE POLICY "auth_all_service_orders"                  ON service_orders                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_service_order_services"          ON service_order_services          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_service_order_batches"           ON service_order_batches           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_service_order_external_services" ON service_order_external_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Quotes Module
CREATE POLICY "auth_all_quotes"                  ON quotes                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quote_services"          ON quote_services          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quote_batches"           ON quote_batches           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_quote_external_services" ON quote_external_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_batch_reservations"      ON batch_reservations      FOR ALL TO authenticated USING (true) WITH CHECK (true);


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

-- workshop_settings
CREATE POLICY "anon_all_workshop_settings"
  ON workshop_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- bank_account_histories
CREATE POLICY "anon_all_bank_account_histories"
  ON bank_account_histories FOR ALL TO anon USING (true) WITH CHECK (true);

-- Service Orders Module
CREATE POLICY "anon_all_service_orders"                  ON service_orders                  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_service_order_services"          ON service_order_services          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_service_order_batches"           ON service_order_batches           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_service_order_external_services" ON service_order_external_services FOR ALL TO anon USING (true) WITH CHECK (true);

-- Quotes Module
CREATE POLICY "anon_all_quotes"                  ON quotes                  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_services"          ON quote_services          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_batches"           ON quote_batches           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quote_external_services" ON quote_external_services FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_batch_reservations"      ON batch_reservations      FOR ALL TO anon USING (true) WITH CHECK (true);


-- ============================================================
-- REALTIME — enable publications for live listening
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'workshop_settings',
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
    'service_order_external_services',
    'quotes'
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
