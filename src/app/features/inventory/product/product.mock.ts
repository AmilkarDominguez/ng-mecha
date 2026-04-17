import { Product } from '../../../core/models/product.model';

// Category IDs  (from product-category.mock.ts)
// pc-...001 = Lubricantes y Aceites
// pc-...002 = Frenos y Suspensión
// pc-...003 = Motor y Distribución
// pc-...004 = Electricidad y Baterías
// pc-...005 = Filtros
// pc-...006 = Herramientas
// pc-...007 = Neumáticos y Llantas

// Presentation IDs  (from product-presentation.mock.ts)
// pp-...001 = Unidad (UND)
// pp-...002 = Litro (LT)
// pp-...003 = Galón (GAL)
// pp-...004 = Kit (KIT)
// pp-...005 = Par (PAR)
// pp-...006 = Juego (JGO)
// pp-...007 = Caja (CJA)

export const PRODUCT_MOCK: Product[] = [
  {
    id: 'pr-0001-0000-0000-000000000001',
    category_id: 'a1000001-0000-4000-8000-000000000001',
    presentation_id: 'b2000001-0000-4000-8000-000000000002',
    name: 'Aceite de Motor 20W-50 Mineral',
    description: 'Aceite mineral multigrado para motores a gasolina y diésel de uso intensivo. Recomendado para motores con desgaste moderado.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-07-15'),
  },
  {
    id: 'pr-0001-0000-0000-000000000002',
    category_id: 'a1000001-0000-4000-8000-000000000001',
    presentation_id: 'b2000001-0000-4000-8000-000000000003',
    name: 'Aceite de Motor 15W-40 Sintético',
    description: 'Aceite sintético de alto rendimiento para motores modernos de alta compresión. Mayor protección en arranques en frío.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-01-12'),
    updated_at: new Date('2024-08-01'),
  },
  {
    id: 'pr-0001-0000-0000-000000000003',
    category_id: 'a1000001-0000-4000-8000-000000000005',
    presentation_id: 'b2000001-0000-4000-8000-000000000001',
    name: 'Filtro de Aceite Universal Bosch',
    description: 'Filtro de aceite de cartucho, compatibilidad universal para vehículos livianos y camionetas. Eficiencia de filtrado 99.5%.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-06-20'),
  },
  {
    id: 'pr-0001-0000-0000-000000000004',
    category_id: 'a1000001-0000-4000-8000-000000000005',
    presentation_id: 'b2000001-0000-4000-8000-000000000001',
    name: 'Filtro de Aire Cónico de Alto Flujo',
    description: 'Filtro de aire de algodón lavable para motores de 1.4 a 2.0 litros. Aumenta el caudal de aire y mejora la respuesta del motor.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-09-10'),
  },
  {
    id: 'pr-0001-0000-0000-000000000005',
    category_id: 'a1000001-0000-4000-8000-000000000002',
    presentation_id: 'b2000001-0000-4000-8000-000000000005',
    name: 'Pastillas de Freno Delanteras Ferodo',
    description: 'Pastillas de freno de disco para eje delantero. Material semimetálico con bajo nivel de polvo y alta resistencia al calor.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-07-22'),
  },
  {
    id: 'pr-0001-0000-0000-000000000006',
    category_id: 'a1000001-0000-4000-8000-000000000002',
    presentation_id: 'b2000001-0000-4000-8000-000000000001',
    name: 'Amortiguador Trasero Monroe Reflex',
    description: 'Amortiguador de gas de doble tubo para eje trasero. Diseño reforzado para caminos en mal estado.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-08-15'),
  },
  {
    id: 'pr-0001-0000-0000-000000000007',
    category_id: 'a1000001-0000-4000-8000-000000000003',
    presentation_id: 'b2000001-0000-4000-8000-000000000004',
    name: 'Kit de Distribución Gates',
    description: 'Kit completo de distribución incluye correa dentada, tensor hidráulico y polea guía. Compatible con motores 1.6L y 1.8L.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-02-18'),
    updated_at: new Date('2024-09-05'),
  },
  {
    id: 'pr-0001-0000-0000-000000000008',
    category_id: 'a1000001-0000-4000-8000-000000000003',
    presentation_id: 'b2000001-0000-4000-8000-000000000007',
    name: 'Bujía de Encendido NGK Platino',
    description: 'Bujías de platino de alto rendimiento para motores de inyección multipunto. Vida útil extendida hasta 60.000 km.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-03-05'),
    updated_at: new Date('2024-09-20'),
  },
  {
    id: 'pr-0001-0000-0000-000000000009',
    category_id: 'a1000001-0000-4000-8000-000000000004',
    presentation_id: 'b2000001-0000-4000-8000-000000000001',
    name: 'Batería 12V 65Ah Bosch S5',
    description: 'Batería de plomo-ácido libre de mantenimiento. Alta capacidad de arranque en frío (CCA 640A). Para vehículos medianos y SUV.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-03-12'),
    updated_at: new Date('2024-10-01'),
  },
  {
    id: 'pr-0001-0000-0000-000000000010',
    category_id: 'a1000001-0000-4000-8000-000000000007',
    presentation_id: 'b2000001-0000-4000-8000-000000000001',
    name: 'Neumático 195/65R15 Bridgestone',
    description: 'Neumático radial para automóviles de pasajeros. Baja resistencia al rodamiento y excelente agarre en mojado.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-04-02'),
    updated_at: new Date('2024-10-15'),
  },
  {
    id: 'pr-0001-0000-0000-000000000011',
    category_id: 'a1000001-0000-4000-8000-000000000006',
    presentation_id: 'b2000001-0000-4000-8000-000000000006',
    name: 'Juego de Llaves Combinadas 8-19mm',
    description: 'Set de llaves combinadas (boca-corona) en acero cromo-vanadio. Incluye medidas de 8, 10, 12, 13, 14, 17 y 19mm.',
    photo: null,
    state: 'ACTIVE',
    created_at: new Date('2024-04-15'),
    updated_at: new Date('2024-10-20'),
  },
  {
    id: 'pr-0001-0000-0000-000000000012',
    category_id: 'a1000001-0000-4000-8000-000000000001',
    presentation_id: 'b2000001-0000-4000-8000-000000000002',
    name: 'Líquido de Frenos DOT 4',
    description: 'Fluido de frenos sintético DOT 4 con punto de ebullición seco de 230°C. Para sistemas de frenos ABS y convencionales.',
    photo: null,
    state: 'INACTIVE',
    created_at: new Date('2024-05-08'),
    updated_at: new Date('2024-06-30'),
  },
];
