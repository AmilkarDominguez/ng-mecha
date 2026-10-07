-- ============================================================
-- Mecha Sys — Seed Inicial (solo datos operativos)
-- Database: Supabase (PostgreSQL)
--
-- A diferencia de seed.sql (que siembra ~25 entidades de DEMOSTRACION:
-- customers, vehicles, products, batches, brands, suppliers, mechanics,
-- services, quotes, service_orders, bank_accounts, etc.), este script
-- SOLO inserta los 3 datasets que el sistema necesita para arrancar y
-- operar, sin ningun registro de negocio:
--
--   1. users                  — cuentas para poder iniciar sesion
--   2. bank_transaction_types — catalogo que consumen por nombre las RPCs
--                                financieras (pagos de orden, compras de
--                                lote, egresos de servicios externos,
--                                registro manual de ingresos/egresos) —
--                                sin estos registros esos flujos fallan
--                                con error explicito
--   3. workshop_settings      — fila singleton de configuracion del
--                                taller (nombre, logo, contacto,
--                                correlativo de ordenes), mas el bucket
--                                de Storage 'workshop-logo' y sus policies
--
-- Uso: pensado para un entorno donde ya corriste tables.sql (y
-- migrate.sql si aplica) pero NO quieres los datos de demo de seed.sql
-- (ej. una base "limpia" lista para operar, o un ambiente de staging).
--
-- Nota: tables.sql YA inserta estos mismos 3 datasets inline (junto a
-- la definicion de cada tabla) — este script es la version standalone,
-- documentada y re-ejecutable por separado, para cuando necesitas
-- (re)aplicar solo esto sin correr tables.sql completo. Todas las
-- sentencias son idempotentes (ON CONFLICT / guardas de duplicado) —
-- se puede correr mas de una vez sin duplicar filas.
--
-- Requiere que las tablas ya existan (tables.sql). No inserta nada en
-- customers, vehicles, products, batches, brands, suppliers, mechanics,
-- services, external_services, warehouses, bank_accounts, quotes,
-- service_orders ni ninguna de sus tablas pivote.
-- ============================================================


-- ============================================================
-- 1. users — cuentas de acceso al sistema
-- ============================================================
-- El password se envia en texto plano; el trigger trg_hash_user_password
-- (definido en tables.sql) lo hashea con bcrypt automaticamente antes de
-- guardarse. Cambiar/eliminar estos usuarios antes de pasar a produccion.
INSERT INTO users (name, lastname, email, password, allow_deletion, rol, state) VALUES
  ('Admin',      'Sistema', 'admin@mecha.test',     'Admin123!',     false, 'ADMIN',     'ACTIVE'),
  ('Ventas',     'Prueba',  'ventas@mecha.test',    'Ventas123!',    true,  'SALES',     'ACTIVE'),
  ('Inventario', 'Prueba',  'inventario@mecha.test','Inventario123!',true,  'INVENTORY', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 2. bank_transaction_types — catalogo requerido por las RPCs financieras
-- ============================================================
-- Estos 6 tipos son referenciados POR NOMBRE desde las RPCs de
-- pagos/compras/egresos (ver .claude/rules/service-order-flow.md §9 y
-- .claude/rules/bank-manual-movements.md §1). allow_deletion = false:
-- no se pueden borrar desde el CRUD de Tipos de Transaccion.
INSERT INTO bank_transaction_types (name, description, type, allow_deletion, state) VALUES
  ('Creación de cuenta bancaria',  'Creación de cuenta bancaria.',  'INCOME',  false, 'ACTIVE'),
  ('Depósito a cuenta bancaria',   'Depósito a cuenta bancaria.',   'INCOME',  false, 'ACTIVE'),
  ('Retiro de cuenta bancaria',    'Retiro de cuenta bancaria.',    'EXPENSE', false, 'ACTIVE'),
  ('Compra lote de productos',     'Compra lote de productos.',     'EXPENSE', false, 'ACTIVE'),
  ('Pago de orden de servicio',    'Pago de orden de servicio.',    'INCOME',  false, 'ACTIVE'),
  ('Pago servicio externo',        'Pago servicio externo.',        'EXPENSE', false, 'ACTIVE')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. workshop_settings — configuracion base del taller (fila singleton)
-- ============================================================
-- "singleton" + su UNIQUE + CHECK garantizan que nunca exista una
-- segunda fila (ver .claude/rules/admin-settings.md §4).
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

-- Bucket de Storage para el logo del taller + policies de lectura/escritura
-- (mismo criterio permisivo que el resto del RLS del proyecto, sin roles
-- todavia — ver .claude/rules/admin-settings.md §5).
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-logo', 'workshop-logo', true)
ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY no soporta IF NOT EXISTS: se guarda cada una en su propio
-- bloque DO, capturando duplicate_object por si tables.sql ya las creo.
DO $$ BEGIN
  CREATE POLICY "public_read_workshop_logo" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'workshop-logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_write_workshop_logo" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'workshop-logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_update_workshop_logo" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'workshop-logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon_write_workshop_logo" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'workshop-logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon_update_workshop_logo" ON storage.objects
    FOR UPDATE TO anon USING (bucket_id = 'workshop-logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
