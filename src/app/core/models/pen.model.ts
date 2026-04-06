export type PenType = 'cuarentena' | 'espera' | 'faena' | 'descanso' | 'enfermeria';

export interface Pen {
  id: string;
  name: string;
  code: string;
  location: string;
  type: PenType;
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
