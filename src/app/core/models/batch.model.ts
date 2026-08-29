export type EntityState = 'ACTIVE' | 'INACTIVE';

export interface Batch {
  id: string;
  product_id: string;
  warehouse_id: string;
  supplier_id: string;
  brand_id: string;
  bank_account_id?: string | null;
  cost: number | null;
  price: number | null;
  code: string | null;
  stock: number | null;
  min_stock: number | null;
  description: string | null;
  compatible_brands: string | null;
  compatible_models: string | null;
  expiration_date: string | Date | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
  // Joins opcionales — presentes cuando vienen de SPBatch.get() (select con embeds)
  product?: { name: string | null; category?: { id: string; name: string | null } | null } | null;
  warehouse?: { name: string | null } | null;
  brand?: { name: string | null } | null;
}
