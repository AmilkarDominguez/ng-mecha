export type UserRole = 'admin' | 'supervisor' | 'operador' | 'auditor' | 'visualizador';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
