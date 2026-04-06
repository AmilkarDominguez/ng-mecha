export type SlaughterStatus = 'procesado' | 'en_camara' | 'despachado';
export type InspectionResult = 'aprobado' | 'observado' | 'rechazado';

export interface SlaughterRecord {
  id: string;
  recordNumber: string;
  slaughterDate: Date;
  animalTag: string;
  lotNumber: string;
  rancher: string;
  breed: string;
  gender: string;
  hotWeight: number;
  coldWeight: number | null;
  yieldPercentage: number | null;
  operator: string;
  veterinaryInspection: boolean;
  inspectionResult: InspectionResult;
  label2Code: string;
  coldRoomAssigned: string;
  status: SlaughterStatus;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}
