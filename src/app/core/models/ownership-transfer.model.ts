export interface OwnershipTransfer {
  id: string;
  animalId: string;
  animalTag: string;
  fromRancherId: string;
  fromRancherName: string;
  fromBrandId: string;
  fromBrandName: string;
  toRancherId: string;
  toRancherName: string;
  toBrandId: string;
  toBrandName: string;
  reason: string;
  supportDocUrl: string;
  registeredById: string;
  registeredByName: string;
  transferredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
