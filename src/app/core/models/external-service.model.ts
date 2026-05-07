import { EntityState } from './product-category.model';

export type ExternalServicesRating = 'GOOD' | 'REGULAR' | 'BAD';

export interface ExternalService {
  id: string;
  name: string | null;
  company_name: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  rating: ExternalServicesRating | null;
  cost: number | null;
  price: number | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
