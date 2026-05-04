export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Batch {
  id: string;
  product_id: string;
  warehouse_id: string;
  supplier_id: string;
  industry_id: string;
  brand_id: string | null;
  cost: number | null;
  price: number | null;
  code: string | null;
  stock: number | null;
  description: string | null;
  compatible_brands: string | null;
  compatible_models: string | null;
  expiration_date: string | Date | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
