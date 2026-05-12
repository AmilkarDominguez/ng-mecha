import { EntityState } from './product-category.model';

export type BankTransactionKind = 'INCOME' | 'EXPENSE';

export interface BankTransactionType {
  id: string;
  name: string | null;
  description: string | null;
  type: BankTransactionKind | null;
  allow_deletion: boolean;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
