export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface ProductCategory {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  photo: string | null;
  icon: string | null;
  view: string | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
