-- ============================================================
-- Mecha Sys — Drop All Objects
-- Database: Supabase (PostgreSQL)
-- ADVERTENCIA: Este script elimina TODA la estructura y datos.
-- Ejecutar solo en entornos de desarrollo/reset.
-- ============================================================


-- ============================================================
-- STORAGE — bucket de logo (workshop_settings)
-- storage.objects/buckets no se eliminan con DROP TABLE de las tablas de
-- negocio (viven en el schema storage), hay que limpiarlos aparte.
-- ============================================================
DROP POLICY IF EXISTS "public_read_workshop_logo" ON storage.objects;
DROP POLICY IF EXISTS "auth_write_workshop_logo"   ON storage.objects;
DROP POLICY IF EXISTS "auth_update_workshop_logo"  ON storage.objects;
DROP POLICY IF EXISTS "anon_write_workshop_logo"   ON storage.objects;
DROP POLICY IF EXISTS "anon_update_workshop_logo"  ON storage.objects;
DELETE FROM storage.objects WHERE bucket_id = 'workshop-logo';
DELETE FROM storage.buckets WHERE id = 'workshop-logo';


-- ============================================================
-- TABLAS — en orden de dependencia (hijos primero)
-- CASCADE elimina FK constraints y políticas asociadas
-- ============================================================
DROP VIEW  IF EXISTS batch_available_stock           CASCADE;
DROP TABLE IF EXISTS batch_reservations              CASCADE;
DROP TABLE IF EXISTS quote_external_services         CASCADE;
DROP TABLE IF EXISTS quote_batches                   CASCADE;
DROP TABLE IF EXISTS quote_services                  CASCADE;
DROP TABLE IF EXISTS service_order_external_services CASCADE;
DROP TABLE IF EXISTS service_order_batches           CASCADE;
DROP TABLE IF EXISTS service_order_services          CASCADE;
DROP TABLE IF EXISTS service_orders                  CASCADE;
DROP TABLE IF EXISTS quotes                          CASCADE;
DROP TABLE IF EXISTS users                           CASCADE;
DROP TABLE IF EXISTS workshop_settings               CASCADE;
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
DROP FUNCTION IF EXISTS apply_external_service_expense(UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS reverse_external_service_expenses_for_order(UUID) CASCADE;
DROP FUNCTION IF EXISTS reserve_quote_batches(UUID) CASCADE;
DROP FUNCTION IF EXISTS release_quote_reservations(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS convert_quote_to_order(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS expire_overdue_quote_reservations() CASCADE;
DROP FUNCTION IF EXISTS register_bank_income(UUID, UUID, NUMERIC, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS edit_bank_income(UUID, UUID, UUID, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_bank_income(UUID) CASCADE;
DROP FUNCTION IF EXISTS register_bank_expense(UUID, UUID, NUMERIC, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS edit_bank_expense(UUID, UUID, UUID, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_bank_expense(UUID) CASCADE;


-- ============================================================
-- TIPOS (enums)
-- ============================================================
DROP TYPE IF EXISTS user_role_enum                 CASCADE;
DROP TYPE IF EXISTS bank_transaction_kind          CASCADE;
DROP TYPE IF EXISTS external_services_rating_enum CASCADE;
DROP TYPE IF EXISTS contact_type_enum             CASCADE;
DROP TYPE IF EXISTS customer_rating_enum          CASCADE;
DROP TYPE IF EXISTS delivery_time_enum             CASCADE;
DROP TYPE IF EXISTS quote_state_enum               CASCADE;
DROP TYPE IF EXISTS reservation_state_enum         CASCADE;
DROP TYPE IF EXISTS payment_type_enum              CASCADE;
DROP TYPE IF EXISTS order_state_enum               CASCADE;
DROP TYPE IF EXISTS state_enum                     CASCADE;
