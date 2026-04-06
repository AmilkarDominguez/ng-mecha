export interface Carrier {
  id: string;
  businessName: string;
  taxId: string;
  licenseNumber: string;
  phone: string;
  email: string;
  vehiclePlate: string;
  vehicleType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
