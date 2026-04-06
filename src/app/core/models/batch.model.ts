export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Batch {
  id: string;
  productId: string;
  warehouseId: string;
  supplierId: string;
  industryId: string;
  brandId: string | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
  finalPrice: number | null;
  code: string | null;
  stock: number | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  expirationDate: Date | null;
  state: EntityState;
  createdAt: Date;
  updatedAt: Date;
}
