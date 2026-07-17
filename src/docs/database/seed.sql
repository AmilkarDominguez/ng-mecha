-- ============================================================
-- Mecha Sys — Seed de datos de prueba
-- Database: Supabase (PostgreSQL)
-- Ejecutar DESPUES de tables.sql (y migrate.sql si aplica).
-- Idempotente: usa ids fijos + ON CONFLICT (id) DO NOTHING, se
-- puede correr varias veces sin duplicar filas.
-- ============================================================

-- ------------------------------------------------------------
-- Convencion de ids: UUID fijo por fila con el formato
--   00000000-0000-0000-<entidad>-<secuencia>
-- donde <entidad> identifica la tabla y <secuencia> el numero
-- de fila, solo para que este archivo sea legible y referenciable:
--   0001 product_categories        0013 services
--   0002 product_presentations     0014 external_services
--   0003 products                  0015 contacts
--   0004 suppliers                 0016 quotes
--   0005 industries                0017 quote_services
--   0006 brands                    0018 quote_batches
--   0007 warehouses                0019 quote_external_services
--   0008 batches                   0020 batch_reservations
--   0009 bank_accounts             0021 service_orders
--   0010 customers                 0022 service_order_services
--   0011 vehicles                  0023 service_order_batches
--   0012 mechanics                 0024 service_order_external_services
--                                   0025 bank_account_histories
-- Los usuarios (users) y tipos de transaccion (bank_transaction_types)
-- ya vienen sembrados desde tables.sql/migrate.sql y se referencian
-- aqui por email / name en vez de id fijo.
-- ============================================================


-- ============================================================
-- 1. product_categories
-- ============================================================
INSERT INTO product_categories (id, name, title, description, state) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Filtros',     'Filtros',              'Filtros de aceite, aire y combustible.', 'ACTIVE'),
  ('00000000-0000-0000-0001-000000000002', 'Lubricantes', 'Lubricantes',          'Aceites y grasas para motor y transmision.', 'ACTIVE'),
  ('00000000-0000-0000-0001-000000000003', 'Frenos',      'Sistema de frenos',    'Pastillas, discos y accesorios de frenado.', 'ACTIVE'),
  ('00000000-0000-0000-0001-000000000004', 'Electrico',   'Sistema electrico',    'Baterias y componentes electricos.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. product_presentations
-- ============================================================
INSERT INTO product_presentations (id, name, code, description, state) VALUES
  ('00000000-0000-0000-0002-000000000001', 'Unidad',   'UND',  'Se vende por unidad.', 'ACTIVE'),
  ('00000000-0000-0000-0002-000000000002', 'Caja x12', 'CJ12', 'Caja con 12 unidades.', 'ACTIVE'),
  ('00000000-0000-0000-0002-000000000003', 'Galon',    'GAL',  'Presentacion por galon.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. products
-- ============================================================
INSERT INTO products (id, category_id, presentation_id, name, description, state) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'Filtro de aceite',              'Filtro de aceite para motor a gasolina/diesel.', 'ACTIVE'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'Filtro de aire',                'Filtro de aire de admision.', 'ACTIVE'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0002-000000000003', 'Aceite sintetico 20W-50',       'Aceite de motor sintetico.', 'ACTIVE'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000002', 'Pastillas de freno delanteras', 'Juego de pastillas de freno delanteras.', 'ACTIVE'),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0002-000000000001', 'Disco de freno',                'Disco de freno ventilado.', 'ACTIVE'),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0002-000000000001', 'Bateria 12V',                   'Bateria de 12V para automovil.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. suppliers
-- ============================================================
INSERT INTO suppliers (id, name, nit, description, email, address, phone, maps_url, state) VALUES
  ('00000000-0000-0000-0004-000000000001', 'Repuestos Bolivia S.R.L.',    '1023456011', 'Proveedor de repuestos generales.', 'ventas@repuestosbolivia.test', 'Av. Blanco Galindo km 5, Cochabamba', '77712345', NULL, 'ACTIVE'),
  ('00000000-0000-0000-0004-000000000002', 'Lubricantes del Sur',        '1023456022', 'Proveedor de aceites y lubricantes.', 'contacto@lubdelsur.test',      'Av. Circunvalacion 450, Cochabamba',  '77723456', NULL, 'ACTIVE'),
  ('00000000-0000-0000-0004-000000000003', 'Importadora Frenos Andinos', '1023456033', 'Proveedor de sistemas de frenado.', 'info@frenosandinos.test',      'Calle Ayacucho 890, Cochabamba',      '77734567', NULL, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. industries
-- ============================================================
INSERT INTO industries (id, name, description, state) VALUES
  ('00000000-0000-0000-0005-000000000001', 'Automotriz',        'Vehiculos livianos.', 'ACTIVE'),
  ('00000000-0000-0000-0005-000000000002', 'Motocicletas',      'Motos y cuadratrack.', 'ACTIVE'),
  ('00000000-0000-0000-0005-000000000003', 'Maquinaria Pesada', 'Maquinaria industrial y agricola.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. brands
-- ============================================================
INSERT INTO brands (id, name, description, score, state) VALUES
  ('00000000-0000-0000-0006-000000000001', 'Bosch',  'Repuestos y filtros.', 'A', 'ACTIVE'),
  ('00000000-0000-0000-0006-000000000002', 'Mobil',  'Lubricantes.',         'A', 'ACTIVE'),
  ('00000000-0000-0000-0006-000000000003', 'Brembo', 'Sistemas de freno.',   'A', 'ACTIVE'),
  ('00000000-0000-0000-0006-000000000004', 'Varta',  'Baterias.',            'B', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. warehouses
-- ============================================================
INSERT INTO warehouses (id, name, description, state) VALUES
  ('00000000-0000-0000-0007-000000000001', 'Almacen Central',       'Almacen principal del taller.', 'ACTIVE'),
  ('00000000-0000-0000-0007-000000000002', 'Almacen Sucursal Norte','Almacen de la sucursal norte.',  'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. bank_accounts
-- ============================================================
INSERT INTO bank_accounts (id, name, description, number, balance, state) VALUES
  ('00000000-0000-0000-0009-000000000001', 'Cuenta Principal', 'Cuenta corriente principal del taller.', '1234567890', 5280.00, 'ACTIVE'),
  ('00000000-0000-0000-0009-000000000002', 'Caja Chica',       'Caja chica para gastos menores.',        '0000000001', 500.00,  'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 9. batches
-- ============================================================
INSERT INTO batches (
  id, product_id, warehouse_id, supplier_id, industry_id, brand_id, bank_account_id,
  cost, price, code, stock, compatible_brands, compatible_models, expiration_date, state
) VALUES
  ('00000000-0000-0000-0008-000000000001',
   '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0007-000000000001',
   '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0005-000000000001',
   '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0009-000000000001',
   25.00, 45.00, 'FA-001', 50, 'Toyota, Nissan', 'Corolla, Sentra', (CURRENT_DATE + INTERVAL '2 years')::date, 'ACTIVE'),
  ('00000000-0000-0000-0008-000000000002',
   '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0007-000000000001',
   '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0005-000000000001',
   '00000000-0000-0000-0006-000000000001', NULL,
   20.00, 35.00, 'FR-002', 40, 'Toyota, Nissan', 'Corolla, Frontier', (CURRENT_DATE + INTERVAL '2 years')::date, 'ACTIVE'),
  ('00000000-0000-0000-0008-000000000003',
   '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0007-000000000001',
   '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0005-000000000001',
   '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0009-000000000001',
   60.00, 95.00, 'AC-003', 30, 'Universal', 'Universal', (CURRENT_DATE + INTERVAL '1 year')::date, 'ACTIVE'),
  ('00000000-0000-0000-0008-000000000004',
   '00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0007-000000000002',
   '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0005-000000000001',
   '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0009-000000000002',
   90.00, 150.00, 'PF-004', 20, 'Nissan', 'Frontier', (CURRENT_DATE + INTERVAL '3 years')::date, 'ACTIVE'),
  ('00000000-0000-0000-0008-000000000005',
   '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0007-000000000002',
   '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0005-000000000001',
   '00000000-0000-0000-0006-000000000003', NULL,
   110.00, 180.00, 'DF-005', 15, 'Nissan', 'Frontier', (CURRENT_DATE + INTERVAL '3 years')::date, 'ACTIVE'),
  ('00000000-0000-0000-0008-000000000006',
   '00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0007-000000000001',
   '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0005-000000000002',
   '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0009-000000000001',
   250.00, 380.00, 'BAT-006', 10, 'Suzuki', 'Alto', (CURRENT_DATE + INTERVAL '18 months')::date, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 10. bank_account_histories (apertura de cuentas)
-- ============================================================
INSERT INTO bank_account_histories (id, bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept) VALUES
  ('00000000-0000-0000-0025-000000000001',
   '00000000-0000-0000-0009-000000000001',
   (SELECT id FROM users WHERE email = 'admin@mecha.test'),
   (SELECT id FROM bank_transaction_types WHERE name = 'Creación de cuenta bancaria' LIMIT 1),
   5000.00, 5000.00, '00000000-0000-0000-0009-000000000001', 'Apertura de Cuenta Principal'),
  ('00000000-0000-0000-0025-000000000002',
   '00000000-0000-0000-0009-000000000002',
   (SELECT id FROM users WHERE email = 'admin@mecha.test'),
   (SELECT id FROM bank_transaction_types WHERE name = 'Creación de cuenta bancaria' LIMIT 1),
   300.00, 300.00, '00000000-0000-0000-0009-000000000002', 'Apertura de Caja Chica')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 11. customers
-- ============================================================
INSERT INTO customers (id, name, lastname, ci, nit, address, birthdate, phone, rating, state) VALUES
  ('00000000-0000-0000-0010-000000000001', 'Juan',    'Perez Rocha',    '4521367',  '4521367011', 'Av. America 123, Cochabamba',    '1985-03-12', '70011122', 'GOOD',    'ACTIVE'),
  ('00000000-0000-0000-0010-000000000002', 'Maria',   'Fernandez Vega', '5834721',  '5834721011', 'Calle Espana 456, Cochabamba',   '1990-07-25', '70022233', 'GOOD',    'ACTIVE'),
  ('00000000-0000-0000-0010-000000000003', 'Carlos',  'Mamani Condori', '3298471',  '3298471011', 'Av. Heroinas 789, Cochabamba',   '1978-11-02', '70033344', 'REGULAR', 'ACTIVE'),
  ('00000000-0000-0000-0010-000000000004', 'Ana',     'Quispe Torrez',  '6127349',  '6127349011', 'Calle Junin 321, Cochabamba',    '1995-01-30', '70044455', 'BAD',     'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 12. vehicles
-- ============================================================
INSERT INTO vehicles (id, customer_id, license_plate, brand, model, displacement, year, chassis_number, description, state) VALUES
  ('00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0010-000000000001', '1234-ABC', 'Toyota',  'Corolla',   '1.8L', '2016', 'JTX1234567890001', 'Sedan color blanco.', 'ACTIVE'),
  ('00000000-0000-0000-0011-000000000002', '00000000-0000-0000-0010-000000000002', 'MOT-567',  'Honda',   'CBR 250R',  '250cc','2019', 'HND1234567890002', 'Motocicleta deportiva roja.', 'ACTIVE'),
  ('00000000-0000-0000-0011-000000000003', '00000000-0000-0000-0010-000000000003', '5678-XYZ', 'Nissan',  'Frontier',  '2.5L', '2014', 'NIS1234567890003', 'Camioneta doble cabina.', 'ACTIVE'),
  ('00000000-0000-0000-0011-000000000004', '00000000-0000-0000-0010-000000000004', '9012-DEF', 'Suzuki',  'Alto',      '1.0L', '2020', 'SUZ1234567890004', 'Hatchback color gris.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 13. mechanics
-- ============================================================
INSERT INTO mechanics (id, name, lastname, ci, nit, address, email, birthdate, phone, incorporated_at, retired_at, state) VALUES
  ('00000000-0000-0000-0012-000000000001', 'Roberto', 'Choque Flores', '4123890', '4123890011', 'Zona Sarco, Cochabamba',    'roberto.choque@mecha.test', '1982-05-10', '70055566', (CURRENT_DATE - INTERVAL '3 years'), NULL, 'ACTIVE'),
  ('00000000-0000-0000-0012-000000000002', 'Luis',    'Vargas Rios',   '5219034', '5219034011', 'Zona Queru Queru, Cochabamba', 'luis.vargas@mecha.test',  '1988-09-18', '70066677', (CURRENT_DATE - INTERVAL '2 years'), NULL, 'ACTIVE'),
  ('00000000-0000-0000-0012-000000000003', 'Fernando','Rojas Guzman',  '6023481', '6023481011', 'Zona Tupuraya, Cochabamba', 'fernando.rojas@mecha.test',  '1991-12-04', '70077788', (CURRENT_DATE - INTERVAL '1 years'), NULL, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 14. services
-- ============================================================
INSERT INTO services (id, name, code, description, price, state) VALUES
  ('00000000-0000-0000-0013-000000000001', 'Cambio de aceite',        'SV-001', 'Cambio de aceite y filtro de motor.', 80.00,  'ACTIVE'),
  ('00000000-0000-0000-0013-000000000002', 'Alineacion y balanceo',   'SV-002', 'Alineacion de direccion y balanceo de llantas.', 120.00, 'ACTIVE'),
  ('00000000-0000-0000-0013-000000000003', 'Revision de frenos',      'SV-003', 'Inspeccion y ajuste del sistema de frenos.', 60.00,  'ACTIVE'),
  ('00000000-0000-0000-0013-000000000004', 'Diagnostico electrico',   'SV-004', 'Diagnostico computarizado del sistema electrico.', 100.00, 'ACTIVE'),
  ('00000000-0000-0000-0013-000000000005', 'Cambio de bateria',       'SV-005', 'Mano de obra para cambio de bateria.', 50.00,  'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 15. external_services
-- ============================================================
INSERT INTO external_services (id, name, company_name, description, address, phone, rating, cost, price, state) VALUES
  ('00000000-0000-0000-0014-000000000001', 'Torneado de discos', 'Torneria Central',  'Torneado y rectificado de discos de freno.', 'Av. 6 de Agosto 100, Cochabamba', '77745678', 'GOOD', 40.00, 70.00,  'ACTIVE'),
  ('00000000-0000-0000-0014-000000000002', 'Servicio de grua',   'Grua Express',      'Traslado de vehiculos averiados.',           'Av. Ayacucho 200, Cochabamba',    '77756789', 'GOOD', 80.00, 150.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 16. contacts (referencian clientes)
-- ============================================================
INSERT INTO contacts (id, reference_id, name, number, type) VALUES
  ('00000000-0000-0000-0015-000000000001', '00000000-0000-0000-0010-000000000001', 'Lucia Perez',  '70099001', 'SECONDARY'),
  ('00000000-0000-0000-0015-000000000002', '00000000-0000-0000-0010-000000000003', 'Elena Mamani', '70099002', 'EMERGENCY')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 17. service_orders (cabecera; se insertan antes que quotes para
--     que quotes.converted_service_order_id pueda referenciarlas)
-- ============================================================
INSERT INTO service_orders (
  id, customer_id, vehicle_id, mechanic_id, user_id, number, description,
  total, have, must, iva, total_iva, with_iva, mileage,
  started_date, ended_date, return_date, state, payment_type
) VALUES
  ('00000000-0000-0000-0021-000000000001',
   '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0011-000000000003',
   '00000000-0000-0000-0012-000000000001', (SELECT id FROM users WHERE email = 'admin@mecha.test'),
   'OS-0001', 'Revision de frenos con cambio de pastillas y grua de traslado.',
   360.00, 360.00, 0.00, NULL, NULL, false, '85000',
   (CURRENT_DATE - INTERVAL '3 days')::date, (CURRENT_DATE - INTERVAL '1 day')::date, (CURRENT_DATE - INTERVAL '1 day')::date,
   'COMPLETED', 'CASH'),
  ('00000000-0000-0000-0021-000000000002',
   '00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0011-000000000004',
   '00000000-0000-0000-0012-000000000002', (SELECT id FROM users WHERE email = 'ventas@mecha.test'),
   'OS-0002', 'Cambio de aceite y bateria, pago a credito.',
   555.00, 200.00, 355.00, NULL, NULL, false, '42000',
   CURRENT_DATE, NULL, NULL,
   'IN_PROGRESS', 'CREDIT')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 18. quotes
-- ============================================================
INSERT INTO quotes (
  id, customer_id, vehicle_id, user_id, converted_service_order_id,
  number, description, total, iva, total_iva, with_iva, expiration_date, state
) VALUES
  ('00000000-0000-0000-0016-000000000001',
   '00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0011-000000000001',
   (SELECT id FROM users WHERE email = 'ventas@mecha.test'), NULL,
   'CT-0001', 'Cambio de aceite con filtro.', 125.00, NULL, NULL, false,
   (CURRENT_DATE + INTERVAL '10 days')::date, 'PENDING'),
  ('00000000-0000-0000-0016-000000000002',
   '00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0011-000000000002',
   (SELECT id FROM users WHERE email = 'ventas@mecha.test'), NULL,
   'CT-0002', 'Alineacion y cambio de aceite sintetico.', 500.00, NULL, NULL, false,
   (CURRENT_DATE + INTERVAL '15 days')::date, 'APPROVED'),
  ('00000000-0000-0000-0016-000000000003',
   '00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0011-000000000003',
   (SELECT id FROM users WHERE email = 'ventas@mecha.test'), '00000000-0000-0000-0021-000000000001',
   'CT-0003', 'Revision de frenos, cambio de pastillas y grua.', 360.00, NULL, NULL, false,
   (CURRENT_DATE - INTERVAL '5 days')::date, 'CONVERTED')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 19. quote_services
-- ============================================================
INSERT INTO quote_services (id, quote_id, service_id, discount, price, quantity, subtotal) VALUES
  ('00000000-0000-0000-0017-000000000001', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0013-000000000001', 0, 80.00, 1, 80.00),
  ('00000000-0000-0000-0017-000000000002', '00000000-0000-0000-0016-000000000002', '00000000-0000-0000-0013-000000000002', 0, 120.00, 1, 120.00),
  ('00000000-0000-0000-0017-000000000003', '00000000-0000-0000-0016-000000000003', '00000000-0000-0000-0013-000000000003', 0, 60.00, 1, 60.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 20. quote_batches
-- ============================================================
INSERT INTO quote_batches (id, quote_id, batch_id, description, delivery_time, quantity, price, discount, subtotal) VALUES
  ('00000000-0000-0000-0018-000000000001', '00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0008-000000000001', 'Filtro de aceite', 'IMMEDIATE', 1, 45.00, 0, 45.00),
  ('00000000-0000-0000-0018-000000000002', '00000000-0000-0000-0016-000000000002', '00000000-0000-0000-0008-000000000003', 'Aceite sintetico 20W-50', 'IMMEDIATE', 4, 95.00, 0, 380.00),
  ('00000000-0000-0000-0018-000000000003', '00000000-0000-0000-0016-000000000003', '00000000-0000-0000-0008-000000000004', 'Pastillas de freno delanteras', 'IMMEDIATE', 1, 150.00, 0, 150.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 21. quote_external_services
-- ============================================================
INSERT INTO quote_external_services (id, quote_id, external_service_id, cost, price, quantity, subtotal) VALUES
  ('00000000-0000-0000-0019-000000000001', '00000000-0000-0000-0016-000000000003', '00000000-0000-0000-0014-000000000002', 80.00, 150.00, 1, 150.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 22. batch_reservations (cotizacion CT-0002, APPROVED, reserva activa)
-- ============================================================
INSERT INTO batch_reservations (id, quote_batch_id, batch_id, quantity, reserved_until, state) VALUES
  ('00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0018-000000000002', '00000000-0000-0000-0008-000000000003', 4, (CURRENT_DATE + INTERVAL '15 days')::date, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 23. service_order_services
-- ============================================================
INSERT INTO service_order_services (id, service_id, service_order_id, quote_id, discount, price, quantity, subtotal) VALUES
  ('00000000-0000-0000-0022-000000000001', '00000000-0000-0000-0013-000000000003', '00000000-0000-0000-0021-000000000001', '00000000-0000-0000-0016-000000000003', 0, 60.00, 1, 60.00),
  ('00000000-0000-0000-0022-000000000002', '00000000-0000-0000-0013-000000000001', '00000000-0000-0000-0021-000000000002', NULL, 0, 80.00, 1, 80.00),
  ('00000000-0000-0000-0022-000000000003', '00000000-0000-0000-0013-000000000005', '00000000-0000-0000-0021-000000000002', NULL, 0, 50.00, 1, 50.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 24. service_order_batches
-- ============================================================
INSERT INTO service_order_batches (id, batch_id, service_order_id, quote_id, quantity, delivery_time, price, discount, subtotal) VALUES
  ('00000000-0000-0000-0023-000000000001', '00000000-0000-0000-0008-000000000004', '00000000-0000-0000-0021-000000000001', '00000000-0000-0000-0016-000000000003', 1, 'IMMEDIATE', 150.00, 0, 150.00),
  ('00000000-0000-0000-0023-000000000002', '00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0021-000000000002', NULL, 1, 'IMMEDIATE', 45.00,  0, 45.00),
  ('00000000-0000-0000-0023-000000000003', '00000000-0000-0000-0008-000000000006', '00000000-0000-0000-0021-000000000002', NULL, 1, 'IMMEDIATE', 380.00, 0, 380.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 25. service_order_external_services
-- ============================================================
INSERT INTO service_order_external_services (id, external_service_id, service_order_id, bank_account_id, quote_id, cost, price, quantity, subtotal) VALUES
  ('00000000-0000-0000-0024-000000000001', '00000000-0000-0000-0014-000000000002', '00000000-0000-0000-0021-000000000001', '00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0016-000000000003', 80.00, 150.00, 1, 150.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 26. bank_account_histories (pagos de ordenes y egreso de servicio externo)
-- ============================================================
INSERT INTO bank_account_histories (id, bank_account_id, user_id, transaction_type_id, amount, balance, transaction_reference, concept) VALUES
  ('00000000-0000-0000-0025-000000000003',
   '00000000-0000-0000-0009-000000000001',
   (SELECT id FROM users WHERE email = 'admin@mecha.test'),
   (SELECT id FROM bank_transaction_types WHERE name = 'Pago de orden de servicio' LIMIT 1),
   360.00, 5360.00, '00000000-0000-0000-0021-000000000001', 'Pago total orden OS-0001'),
  ('00000000-0000-0000-0025-000000000004',
   '00000000-0000-0000-0009-000000000001',
   (SELECT id FROM users WHERE email = 'admin@mecha.test'),
   (SELECT id FROM bank_transaction_types WHERE name = 'Pago servicio externo' LIMIT 1),
   80.00, 5280.00, '00000000-0000-0000-0024-000000000001', 'Pago servicio externo - grua (OS-0001)'),
  ('00000000-0000-0000-0025-000000000005',
   '00000000-0000-0000-0009-000000000002',
   (SELECT id FROM users WHERE email = 'ventas@mecha.test'),
   (SELECT id FROM bank_transaction_types WHERE name = 'Pago de orden de servicio' LIMIT 1),
   200.00, 500.00, '00000000-0000-0000-0021-000000000002', 'Abono parcial orden OS-0002')
ON CONFLICT (id) DO NOTHING;
