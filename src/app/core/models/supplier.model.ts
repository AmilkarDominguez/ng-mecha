import { Contact } from './contact.model';

export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  name: string;
  nit: string | null;
  description: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  state: EntityState;
  contacts?: Contact[];
  created_at?: string | Date;
  updated_at?: string | Date;
}
