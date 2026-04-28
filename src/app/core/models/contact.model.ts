export type ContactType = 'PRIMARY' | 'SECONDARY';

export interface Contact {
  id?: string;
  reference_id?: string | null;
  name: string | null;
  number: string | null;
  type: ContactType;
  created_at?: string | Date;
  updated_at?: string | Date;
}
