export type ProcessCheckSourceType = 'SERVICE' | 'EXTERNAL_SERVICE';

export interface ServiceOrderProcessCheck {
  id: string;
  service_order_id: string;
  source_type: ProcessCheckSourceType;
  source_id: string;
  process_id: string;
  checked: boolean;
  checked_at: string | Date | null;
  checked_by: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ServiceOrderProcessCheckLine extends ServiceOrderProcessCheck {
  process: { description: string | null; position: number } | null;
  checked_by_user: { id: string; name: string | null; lastname: string | null } | null;
}

// Agrupacion en memoria (cliente) de las filas de checklist por servicio
// o servicio externo de la orden — una seccion por cada uno, con sus
// procesos ordenados por processes.position. No viene asi de la base de
// datos (source_id es polimorfico, sin FK que PostgREST pueda joinear),
// se arma en SPServiceOrderProcessCheck.getSections().
export interface ServiceOrderChecklistSection {
  sourceType: ProcessCheckSourceType;
  sourceId: string;
  sourceName: string;
  items: ServiceOrderProcessCheckLine[];
}
