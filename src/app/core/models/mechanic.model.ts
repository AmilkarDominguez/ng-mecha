import { Contact } from './contact.model';
import { EntityState } from './product-category.model';

export interface Mechanic {
  id: string;
  name: string | null;
  lastname: string | null;
  ci: string | null;
  nit: string | null;
  address: string | null;
  email: string | null;
  birthdate: string | null;
  phone: string | null;
  incorporated_at: string | null;
  retired_at: string | null;
  state: EntityState;
  contacts?: Contact[];
  created_at?: string | Date;
  updated_at?: string | Date;
}
