export type LabelType = 'etiqueta_1' | 'etiqueta_2' | 'etiqueta_3';
export type LabelStatus = 'impresa' | 'anulada' | 'reimpresa';
export type WeightType = 'caliente' | 'frio' | null;

export interface Label {
  id: string;
  labelCode: string;
  labelType: LabelType;
  printedAt: Date;
  carcassCode: string;
  animalTag: string;
  lotNumber: string;
  rancher: string;
  slaughterDate: Date;
  weight: number | null;
  weightType: WeightType;
  destination: string;
  printedBy: string;
  status: LabelStatus;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}
