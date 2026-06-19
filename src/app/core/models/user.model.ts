import { EntityState } from './product-category.model';

export type UserRole = 'ADMIN' | 'SALES' | 'INVENTORY';

export interface User {
  id: string;
  name: string | null;
  lastname: string | null;
  email: string;
  password: string;
  allow_deletion: boolean;
  rol: UserRole;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
