export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  id: string;
  name: string;
  description: string | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
