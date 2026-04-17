export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: string;
  category_id: string | null;
  presentation_id: string | null;
  name: string | null;
  description: string | null;
  photo: string | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
