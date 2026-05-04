import { Contact } from './contact.model';
import { EntityState } from './product-category.model';

export type CustomerRating = 'GOOD' | 'REGULAR' | 'BAD';

export interface Customer {
  id: string;
  name: string | null;
  lastname: string | null;
  ci: string | null;
  nit: string | null;
  address: string | null;
  birthdate: string | null;
  phone: string | null;
  rating: CustomerRating | null;
  state: EntityState;
  contacts?: Contact[];
  created_at?: string | Date;
  updated_at?: string | Date;
}
