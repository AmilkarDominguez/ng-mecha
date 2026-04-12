export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Industry {
  id: string;
  name: string;
  description: string | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
