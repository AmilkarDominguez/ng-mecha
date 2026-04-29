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


-- ============================================================
-- TABLES
-- ============================================================

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
  description TEXT,
  email       TEXT,
  address     TEXT,
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
  wholesale_price NUMERIC(10,2),
  retail_price    NUMERIC(10,2),
  final_price     NUMERIC(10,2),
  code            TEXT,
  stock           NUMERIC,
  description     TEXT,
  brand           TEXT,
  model           TEXT,
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
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT,
  lastname       TEXT,
  ci             TEXT,
  expedition_ci  TEXT,
  code_ci        TEXT,
  nit            TEXT,
  address        TEXT,
  email          TEXT,
  birthdate      DATE,
  phone          TEXT,
  state          state_enum  NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 12. vehicles
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
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id     ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_presentation_id ON products(presentation_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_product_id    ON multimedia(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_id       ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_id     ON batches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_batches_supplier_id      ON batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_industry_id      ON batches(industry_id);
CREATE INDEX IF NOT EXISTS idx_batches_brand_id         ON batches(brand_id);
CREATE INDEX IF NOT EXISTS idx_contacts_reference_id    ON contacts(reference_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id     ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_state           ON vehicles(state);
CREATE INDEX IF NOT EXISTS idx_customers_state          ON customers(state);


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
    'vehicles'
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
ALTER TABLE vehicles              ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES — authenticated role
-- SELECT / INSERT / UPDATE / DELETE
-- ============================================================

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

-- vehicles
CREATE POLICY "auth_select_vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_vehicles"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_vehicles"
  ON vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_vehicles"
  ON vehicles FOR DELETE TO authenticated USING (true);


-- ============================================================
-- RLS POLICIES — anon role (desarrollo sin auth activo)
-- Permite acceso completo al rol anon mientras no hay sesión.
-- Remover estas políticas cuando se active el sistema de auth.
-- ============================================================

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

-- vehicles
CREATE POLICY "anon_select_vehicles"
  ON vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_vehicles"
  ON vehicles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_vehicles"
  ON vehicles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_vehicles"
  ON vehicles FOR DELETE TO anon USING (true);


-- ============================================================
-- REALTIME — enable publications for live listening
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
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
    'vehicles'
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
