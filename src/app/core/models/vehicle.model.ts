import { EntityState } from './product-category.model';

export interface Vehicle {
  id: string;
  customer_id: string | null;
  license_plate: string | null;
  brand: string | null;
  model: string | null;
  displacement: string | null;
  year: string | null;
  chassis_number: string | null;
  description: string | null;
  state: EntityState;
  created_at?: string | Date;
  updated_at?: string | Date;
}
