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
DROP TABLE IF EXISTS service_order_external_services CASCADE;
DROP TABLE IF EXISTS service_order_batches           CASCADE;
DROP TABLE IF EXISTS service_order_services          CASCADE;
DROP TABLE IF EXISTS service_orders                  CASCADE;
DROP TABLE IF EXISTS users                           CASCADE;
DROP TABLE IF EXISTS bank_account_histories CASCADE;
DROP TABLE IF EXISTS bank_transaction_types CASCADE;
DROP TABLE IF EXISTS bank_accounts         CASCADE;
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
DROP FUNCTION IF EXISTS register_service_order_payment(UUID, UUID, UUID, NUMERIC, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS edit_service_order_payment(UUID, UUID, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_service_order_payment(UUID) CASCADE;
DROP FUNCTION IF EXISTS apply_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS reconcile_batch_purchase(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS reverse_batch_purchase(UUID) CASCADE;


-- ============================================================
-- TIPOS (enums)
-- ============================================================
DROP TYPE IF EXISTS user_role_enum                 CASCADE;
DROP TYPE IF EXISTS bank_transaction_kind          CASCADE;
DROP TYPE IF EXISTS external_services_rating_enum CASCADE;
DROP TYPE IF EXISTS contact_type_enum             CASCADE;
DROP TYPE IF EXISTS customer_rating_enum          CASCADE;
DROP TYPE IF EXISTS delivery_time_enum             CASCADE;
DROP TYPE IF EXISTS payment_type_enum              CASCADE;
DROP TYPE IF EXISTS order_state_enum               CASCADE;
DROP TYPE IF EXISTS state_enum                     CASCADE;
