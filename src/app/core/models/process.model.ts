export interface Process {
  id?: string;
  reference_id?: string | null;
  description: string | null;
  position: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}
