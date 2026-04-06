export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  id: string;
  name: string;
  description: string | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
