export type GuideStatus = 'pendiente' | 'recibida' | 'observada' | 'rechazada';

export interface MovementGuide {
  id: string;
  guideNumber: string;
  issueDate: Date;
  expiryDate: Date;
  rancher: string;
  carrier: string;
  vehiclePlate: string;
  originLocation: string;
  destinationLocation: string;
  animalCount: number;
  status: GuideStatus;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}
