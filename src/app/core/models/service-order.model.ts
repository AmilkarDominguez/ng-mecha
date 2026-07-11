import { EntityState } from './product-category.model';
import { Customer } from './customer.model';
import { Vehicle } from './vehicle.model';

export type OrderState = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type PaymentType = 'CASH' | 'CREDIT';
export type DeliveryTime = 'ORDER' | 'IMMEDIATE';

export interface ServiceOrder {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  mechanic_id: string | null;
  user_id: string | null;
  number: string | null;
  description: string | null;
  total: number | null;
  have: number | null;
  must: number | null;
  iva: number | null;
  total_iva: number | null;
  with_iva: boolean;
  mileage: string | null;
  draft_expiration_date: string | null;
  started_date: string | null;
  ended_date: string | null;
  return_date: string | null;
  state: OrderState;
  payment_type: PaymentType;
  created_at?: string | Date;
  updated_at?: string | Date;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface ServiceOrderService {
  id: string;
  service_id: string | null;
  service_order_id: string | null;
  discount: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderBatch {
  id: string;
  batch_id: string | null;
  service_order_id: string | null;
  quantity: number | null;
  delivery_time: DeliveryTime;
  price: number | null;
  discount: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderExternalService {
  id: string;
  external_service_id: string | null;
  service_order_id: string | null;
  bank_account_id: string | null;
  cost: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderServiceRow extends ServiceOrderService {
  service_name: string;
}

export interface ServiceOrderBatchRow extends ServiceOrderBatch {
  product_name: string;
  industry_name: string;
}

export interface ServiceOrderExternalServiceRow extends ServiceOrderExternalService {
  external_service_name: string;
}

export interface OrderServiceLine {
  id: string;
  service_id: string | null;
  price: number | null;
  quantity: number | null;
  discount: number | null;
  subtotal: number | null;
  service: { name: string | null; code: string | null } | null;
}

export interface OrderBatchLine {
  id: string;
  batch_id: string | null;
  price: number | null;
  quantity: number | null;
  discount: number | null;
  subtotal: number | null;
  delivery_time: DeliveryTime;
  batch: {
    description: string | null;
    product: { name: string | null } | null;
    industry: { name: string | null } | null;
  } | null;
}

export interface OrderExternalLine {
  id: string;
  external_service_id: string | null;
  bank_account_id: string | null;
  cost: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  external_service: { name: string | null; company_name: string | null } | null;
}

export interface ServiceOrderWithLines extends ServiceOrder {
  mechanic: { id: string; name: string | null; lastname: string | null } | null;
  user: { id: string; name: string | null; lastname: string | null } | null;
  order_services: OrderServiceLine[];
  order_batches: OrderBatchLine[];
  order_externals: OrderExternalLine[];
}
