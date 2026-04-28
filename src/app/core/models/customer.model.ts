import { Contact } from './contact.model';
import { EntityState } from './product-category.model';

export interface Customer {
  id: string;
  name: string | null;
  lastname: string | null;
  ci: string | null;
  expedition_ci: string | null;
  code_ci: string | null;
  nit: string | null;
  address: string | null;
  email: string | null;
  birthdate: string | null;
  phone: string | null;
  state: EntityState;
  contacts?: Contact[];
  created_at?: string | Date;
  updated_at?: string | Date;
}
