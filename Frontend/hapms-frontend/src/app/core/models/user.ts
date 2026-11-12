export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin';
export interface User {
  id: string;
  fullName: string;
  patientNumber?: string;
  doctorId?: string;
  email: string;
  role: UserRole;
}
export interface Registration {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  terms: boolean;
}
