export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  address: string | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
