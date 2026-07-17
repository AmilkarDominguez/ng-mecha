import { Customer } from './customer.model';
import { Vehicle } from './vehicle.model';
import { DeliveryTime } from './service-order.model';

export type QuoteState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED' | 'CANCELED';
export type ReservationState = 'ACTIVE' | 'CONSUMED' | 'RELEASED' | 'EXPIRED';

export interface Quote {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  user_id: string | null;
  converted_service_order_id: string | null;
  number: string | null;
  description: string | null;
  total: number | null;
  iva: number | null;
  total_iva: number | null;
  with_iva: boolean;
  expiration_date: string | null;
  state: QuoteState;
  created_at?: string | Date;
  updated_at?: string | Date;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface QuoteService {
  id: string;
  quote_id: string | null;
  service_id: string | null;
  discount: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface QuoteBatch {
  id: string;
  quote_id: string | null;
  batch_id: string | null;
  description: string | null;
  delivery_time: DeliveryTime;
  quantity: number | null;
  price: number | null;
  discount: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface QuoteExternalService {
  id: string;
  quote_id: string | null;
  external_service_id: string | null;
  cost: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface BatchReservation {
  id: string;
  quote_batch_id: string;
  batch_id: string;
  quantity: number;
  reserved_until: string;
  state: ReservationState;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface QuoteServiceRow extends QuoteService {
  service_name: string;
}

export interface QuoteBatchRow extends QuoteBatch {
  product_name: string;
  industry_name: string;
}

export interface QuoteExternalServiceRow extends QuoteExternalService {
  external_service_name: string;
}

export interface QuoteServiceLine {
  id: string;
  service_id: string | null;
  price: number | null;
  quantity: number | null;
  discount: number | null;
  subtotal: number | null;
  service: { name: string | null; code: string | null } | null;
}

export interface QuoteBatchLine {
  id: string;
  batch_id: string | null;
  description: string | null;
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

export interface QuoteExternalLine {
  id: string;
  external_service_id: string | null;
  cost: number | null;
  price: number | null;
  quantity: number | null;
  subtotal: number | null;
  external_service: { name: string | null; company_name: string | null } | null;
}

export interface QuoteWithLines extends Quote {
  user: { id: string; name: string | null; lastname: string | null } | null;
  lines_services: QuoteServiceLine[];
  lines_batches: QuoteBatchLine[];
  lines_externals: QuoteExternalLine[];
}
