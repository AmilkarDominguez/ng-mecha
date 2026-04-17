import { Batch } from '../../../core/models/batch.model';

// Product IDs    (from product.mock.ts)
// pr-0001-...-001 = Aceite de Motor 20W-50 Mineral
// pr-0001-...-002 = Aceite de Motor 15W-40 Sintético
// pr-0001-...-003 = Filtro de Aceite Universal Bosch
// pr-0001-...-004 = Filtro de Aire Cónico de Alto Flujo
// pr-0001-...-005 = Pastillas de Freno Delanteras Ferodo
// pr-0001-...-006 = Amortiguador Trasero Monroe Reflex
// pr-0001-...-007 = Kit de Distribución Gates
// pr-0001-...-008 = Bujía de Encendido NGK Platino
// pr-0001-...-009 = Batería 12V 65Ah Bosch S5
// pr-0001-...-010 = Neumático 195/65R15 Bridgestone

// Warehouse IDs  (from warehouse.mock.ts)
// wh000001-...-001 = Almacén Principal
// wh000002-...-002 = Almacén de Lubricantes
// wh000003-...-003 = Almacén de Repuestos Eléctricos
// wh000004-...-004 = Almacén de Neumáticos
// wh000005-...-005 = Almacén de Herramientas
// wh000006-...-006 = Almacén de Frenos y Suspensión
// wh000008-...-008 = Almacén de Filtros y Consumibles

// Supplier IDs   (from supplier.mock.ts)
// su-0001-...-001 = Importadora Automotriz del Oriente
// su-0001-...-002 = Distribuidora de Lubricantes Petro Sur
// su-0001-...-004 = Neumáticos y Llantas Rueda Libre
// su-0001-...-005 = ElectroParts Bolivia
// su-0001-...-006 = Filtros y Repuestos Andinos
// su-0001-...-007 = Frenos y Suspensión del Sur S.A.

// Industry IDs   (from industry.mock.ts)
// ind-0001-...-004 = Japonesa
// ind-0001-...-005 = Alemana
// ind-0001-...-006 = Estadounidense

// Brand IDs      (from brand.mock.ts)
// br000001-...-001 = Bosch
// br000002-...-002 = NGK
// br000003-...-003 = Castrol
// br000004-...-004 = Mobil
// br000005-...-005 = Monroe
// br000006-...-006 = Bridgestone
// br000007-...-007 = Gates
// br000008-...-008 = Ferodo

export const BATCH_MOCK: Batch[] = [
  {
    id: 'bt000001-0000-4000-8000-000000000001',
    product_id: 'pr-0001-0000-0000-000000000001',
    warehouse_id: 'wh000002-0000-4000-8000-000000000002',
    supplier_id: 'su-0001-0000-0000-000000000002',
    industry_id: 'ind-0001-0000-0000-000000000005',
    brand_id: 'br000003-0000-4000-8000-000000000003',
    code: 'LOTE-LUB-001',
    stock: 120,
    wholesale_price: 45.00,
    retail_price: 55.00,
    final_price: 60.00,
    description: 'Lote de aceite mineral 20W-50 para motores de uso intensivo. Stock ingresado en presentación de litros.',
    brand: 'Castrol',
    model: 'GTX 20W-50',
    expiration_date: new Date('2026-06-30'),
    state: 'ACTIVE',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-08-10'),
  },
  {
    id: 'bt000002-0000-4000-8000-000000000002',
    product_id: 'pr-0001-0000-0000-000000000002',
    warehouse_id: 'wh000002-0000-4000-8000-000000000002',
    supplier_id: 'su-0001-0000-0000-000000000002',
    industry_id: 'ind-0001-0000-0000-000000000006',
    brand_id: 'br000004-0000-4000-8000-000000000004',
    code: 'LOTE-LUB-002',
    stock: 84,
    wholesale_price: 65.00,
    retail_price: 80.00,
    final_price: 88.00,
    description: 'Aceite sintético 15W-40 de alta protección para motores de inyección electrónica. Presentación galón.',
    brand: 'Mobil',
    model: 'Super 3000 X1',
    expiration_date: new Date('2027-03-31'),
    state: 'ACTIVE',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-09-05'),
  },
  {
    id: 'bt000003-0000-4000-8000-000000000003',
    product_id: 'pr-0001-0000-0000-000000000003',
    warehouse_id: 'wh000008-0000-4000-8000-000000000008',
    supplier_id: 'su-0001-0000-0000-000000000006',
    industry_id: 'ind-0001-0000-0000-000000000005',
    brand_id: 'br000001-0000-4000-8000-000000000001',
    code: 'LOTE-FIL-001',
    stock: 200,
    wholesale_price: 25.00,
    retail_price: 35.00,
    final_price: 40.00,
    description: 'Filtros de aceite Bosch para vehículos livianos. Alta compatibilidad con modelos Toyota, Hyundai y Suzuki.',
    brand: 'Bosch',
    model: 'F026407006',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-07-18'),
  },
  {
    id: 'bt000004-0000-4000-8000-000000000004',
    product_id: 'pr-0001-0000-0000-000000000004',
    warehouse_id: 'wh000008-0000-4000-8000-000000000008',
    supplier_id: 'su-0001-0000-0000-000000000006',
    industry_id: 'ind-0001-0000-0000-000000000005',
    brand_id: 'br000001-0000-4000-8000-000000000001',
    code: 'LOTE-FIL-002',
    stock: 45,
    wholesale_price: 45.00,
    retail_price: 60.00,
    final_price: 68.00,
    description: 'Filtros de aire cónicos lavables para motores de 1.4 a 2.0L. Incrementa flujo de aire en un 30%.',
    brand: 'Bosch',
    model: 'S0082',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-09-22'),
  },
  {
    id: 'bt000005-0000-4000-8000-000000000005',
    product_id: 'pr-0001-0000-0000-000000000005',
    warehouse_id: 'wh000006-0000-4000-8000-000000000006',
    supplier_id: 'su-0001-0000-0000-000000000007',
    industry_id: 'ind-0001-0000-0000-000000000006',
    brand_id: 'br000008-0000-4000-8000-000000000008',
    code: 'LOTE-FRE-001',
    stock: 38,
    wholesale_price: 180.00,
    retail_price: 240.00,
    final_price: 270.00,
    description: 'Pastillas de freno semimetálicas para eje delantero. Bajo polvo y alta resistencia térmica para uso urbano e interurbano.',
    brand: 'Ferodo',
    model: 'FDB1640',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-03-05'),
    updated_at: new Date('2024-10-01'),
  },
  {
    id: 'bt000006-0000-4000-8000-000000000006',
    product_id: 'pr-0001-0000-0000-000000000006',
    warehouse_id: 'wh000006-0000-4000-8000-000000000006',
    supplier_id: 'su-0001-0000-0000-000000000007',
    industry_id: 'ind-0001-0000-0000-000000000006',
    brand_id: 'br000005-0000-4000-8000-000000000005',
    code: 'LOTE-SUS-001',
    stock: 22,
    wholesale_price: 380.00,
    retail_price: 480.00,
    final_price: 530.00,
    description: 'Amortiguadores de gas doble tubo para eje trasero. Diseño Reflex para caminos irregulares bolivianos.',
    brand: 'Monroe',
    model: 'G16029',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-03-18'),
    updated_at: new Date('2024-10-10'),
  },
  {
    id: 'bt000007-0000-4000-8000-000000000007',
    product_id: 'pr-0001-0000-0000-000000000007',
    warehouse_id: 'wh000001-0000-4000-8000-000000000001',
    supplier_id: 'su-0001-0000-0000-000000000001',
    industry_id: 'ind-0001-0000-0000-000000000006',
    brand_id: 'br000007-0000-4000-8000-000000000007',
    code: 'LOTE-MOT-001',
    stock: 15,
    wholesale_price: 650.00,
    retail_price: 850.00,
    final_price: 920.00,
    description: 'Kit completo de distribución para motores de 1.6L y 1.8L. Incluye correa dentada, tensor y polea guía.',
    brand: 'Gates',
    model: 'K015643XS',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-04-02'),
    updated_at: new Date('2024-10-20'),
  },
  {
    id: 'bt000008-0000-4000-8000-000000000008',
    product_id: 'pr-0001-0000-0000-000000000008',
    warehouse_id: 'wh000003-0000-4000-8000-000000000003',
    supplier_id: 'su-0001-0000-0000-000000000005',
    industry_id: 'ind-0001-0000-0000-000000000004',
    brand_id: 'br000002-0000-4000-8000-000000000002',
    code: 'LOTE-ELE-001',
    stock: 300,
    wholesale_price: 28.00,
    retail_price: 38.00,
    final_price: 45.00,
    description: 'Bujías de platino NGK para motores de inyección multipunto. Vida útil extendida, juego de 4 unidades.',
    brand: 'NGK',
    model: 'BKR5EP-11',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-04-15'),
    updated_at: new Date('2024-11-01'),
  },
  {
    id: 'bt000009-0000-4000-8000-000000000009',
    product_id: 'pr-0001-0000-0000-000000000009',
    warehouse_id: 'wh000003-0000-4000-8000-000000000003',
    supplier_id: 'su-0001-0000-0000-000000000005',
    industry_id: 'ind-0001-0000-0000-000000000005',
    brand_id: 'br000001-0000-4000-8000-000000000001',
    code: 'LOTE-ELE-002',
    stock: 18,
    wholesale_price: 580.00,
    retail_price: 720.00,
    final_price: 790.00,
    description: 'Baterías Bosch S5 de 65Ah libre de mantenimiento. Alta potencia de arranque en frío (CCA 640A).',
    brand: 'Bosch',
    model: 'S5 004',
    expiration_date: new Date('2026-12-31'),
    state: 'ACTIVE',
    created_at: new Date('2024-05-10'),
    updated_at: new Date('2024-11-05'),
  },
  {
    id: 'bt000010-0000-4000-8000-000000000010',
    product_id: 'pr-0001-0000-0000-000000000010',
    warehouse_id: 'wh000004-0000-4000-8000-000000000004',
    supplier_id: 'su-0001-0000-0000-000000000004',
    industry_id: 'ind-0001-0000-0000-000000000004',
    brand_id: 'br000006-0000-4000-8000-000000000006',
    code: 'LOTE-NEU-001',
    stock: 48,
    wholesale_price: 750.00,
    retail_price: 920.00,
    final_price: 990.00,
    description: 'Neumáticos Bridgestone 195/65R15 para vehículos de pasajeros. Excelente agarre en mojado y baja resistencia al rodamiento.',
    brand: 'Bridgestone',
    model: 'Turanza T001',
    expiration_date: null,
    state: 'ACTIVE',
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-11-12'),
  },
];
