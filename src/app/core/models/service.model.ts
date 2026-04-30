import { EntityState } from './product-category.model';

export interface Service {
  id: string;
  name: string | null;
  code: string | null;
  description: string | null;
  price: number | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
