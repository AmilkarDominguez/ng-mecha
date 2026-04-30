-- ============================================================
-- Mecha Sys — Drop All Objects
-- Database: Supabase (PostgreSQL)
-- ADVERTENCIA: Este script elimina TODA la estructura y datos.
-- Ejecutar solo en entornos de desarrollo/reset.
-- ============================================================


-- ============================================================
-- TABLAS — en orden de dependencia (hijos primero)
-- CASCADE elimina FK constraints y políticas asociadas
-- ============================================================
DROP TABLE IF EXISTS vehicles              CASCADE;
DROP TABLE IF EXISTS mechanics             CASCADE;
DROP TABLE IF EXISTS services              CASCADE;
DROP TABLE IF EXISTS external_services     CASCADE;
DROP TABLE IF EXISTS contacts              CASCADE;
DROP TABLE IF EXISTS batches               CASCADE;
DROP TABLE IF EXISTS multimedia            CASCADE;
DROP TABLE IF EXISTS products              CASCADE;
DROP TABLE IF EXISTS customers             CASCADE;
DROP TABLE IF EXISTS warehouses            CASCADE;
DROP TABLE IF EXISTS suppliers             CASCADE;
DROP TABLE IF EXISTS industries            CASCADE;
DROP TABLE IF EXISTS brands                CASCADE;
DROP TABLE IF EXISTS product_presentations CASCADE;
DROP TABLE IF EXISTS product_categories    CASCADE;


-- ============================================================
-- FUNCIONES
-- ============================================================
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;


-- ============================================================
-- TIPOS (enums)
-- ============================================================
DROP TYPE IF EXISTS contact_type_enum CASCADE;
DROP TYPE IF EXISTS state_enum        CASCADE;
