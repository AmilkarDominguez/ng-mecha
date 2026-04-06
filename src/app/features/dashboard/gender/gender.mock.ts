import { Gender } from '../../../core/models/gender.model';

export const GENDER_MOCK: Gender[] = [
  {
    id: 'd4e5f6a7-0001-0000-0000-000000000001',
    name: 'Macho',
    code: 'M',
    description: 'Animal de sexo masculino entero, no castrado. Se utiliza principalmente para reproducción o faena directa.',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'd4e5f6a7-0001-0000-0000-000000000002',
    name: 'Hembra',
    code: 'H',
    description: 'Animal de sexo femenino. Puede ser vaquilla (sin parto) o vaca (con al menos un parto registrado).',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'd4e5f6a7-0001-0000-0000-000000000003',
    name: 'Castrado',
    code: 'C',
    description: 'Animal de sexo masculino sometido a castración quirúrgica o química. Produce carne con mayor marmoleado y mejor comportamiento en corrales.',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-06-10'),
  },
  {
    id: 'd4e5f6a7-0001-0000-0000-000000000004',
    name: 'No determinado',
    code: 'ND',
    description: 'Sexo no determinado al momento del ingreso. Se utiliza de forma transitoria hasta que se complete la identificación del animal.',
    isActive: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-04-15'),
  },
];
