export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
