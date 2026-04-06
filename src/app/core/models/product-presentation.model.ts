export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface ProductPresentation {
  id: string;
  name: string | null;
  code: string | null;
  description: string | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
