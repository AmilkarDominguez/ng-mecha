export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  address: string | null;
  slug: string;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
