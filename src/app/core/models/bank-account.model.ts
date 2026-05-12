import { EntityState } from './product-category.model';

export interface BankAccount {
  id: string;
  name: string | null;
  description: string | null;
  number: string | null;
  balance: number | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
