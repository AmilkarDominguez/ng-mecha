export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface ProductCategory {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  icon: string | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
