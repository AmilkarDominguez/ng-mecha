export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: string;
  categoryId: string | null;
  presentationId: string | null;
  name: string | null;
  description: string | null;
  slug: string;
  photo: string | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
