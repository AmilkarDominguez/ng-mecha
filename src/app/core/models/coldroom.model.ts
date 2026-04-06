export interface ColdRoom {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  currentOccupancy: number;
  minTemperature: number;
  maxTemperature: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
