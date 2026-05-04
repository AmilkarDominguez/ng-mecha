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
