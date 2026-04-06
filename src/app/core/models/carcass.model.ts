export type CarcassStatus = 'en_camara' | 'despachado' | 'decomisada';

export interface Carcass {
  id: string;
  carcassCode: string;
  slaughterRecordId: string;
  slaughterDate: Date;
  animalTag: string;
  lotNumber: string;
  rancher: string;
  breed: string;
  gender: string;
  hotWeight: number;
  coldWeight: number | null;
  yieldPercentage: number | null;
  coldRoomAssigned: string;
  entryDate: Date;
  exitDate: Date | null;
  maturationDays: number | null;
  label2Code: string;
  label3Code: string;
  status: CarcassStatus;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}
