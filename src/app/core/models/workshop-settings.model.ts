export interface WorkshopSettings {
  id: string;
  singleton?: boolean;
  name: string;
  slogan: string | null;
  email: string | null;
  address: string | null;
  contact_phone_1: string | null;
  contact_phone_2: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  tiktok_url: string | null;
  extra_url_1: string | null;
  extra_url_2: string | null;
  next_order_number: number | null;
  logo_url: string | null;
  show_in_print: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}
