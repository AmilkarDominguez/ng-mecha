export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface ProductCategory {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
