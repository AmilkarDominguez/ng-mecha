import { BankAccount } from './bank-account.model';
import { BankTransactionType } from './bank-transaction-type.model';

export interface BankAccountHistory {
  id: string;
  bank_account_id: string | null;
  user_id: string | null;
  transaction_type_id: string | null;
  amount: number | null;
  balance: number | null;
  transaction_reference: string | null;
  concept: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  bank_account?: BankAccount;
  transaction_type?: BankTransactionType;
}
