import { EntityState } from './product-category.model';

export interface ExternalService {
  id: string;
  name: string | null;
  description: string | null;
  cost: number | null;
  price: number | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
