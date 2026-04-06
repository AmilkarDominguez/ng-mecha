export type AnimalStatus = 'en_corral' | 'en_faena' | 'despachado' | 'muerto' | 'cuarentena';

export interface Animal {
  id: string;
  tag: string;
  lotNumber: string;
  guideNumber: string;
  rancher: string;
  breed: string;
  gender: string;
  pen: string;
  entryWeight: number;
  entryDate: Date;
  status: AnimalStatus;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}
