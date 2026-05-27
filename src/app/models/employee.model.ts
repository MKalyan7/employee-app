export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  salary: number;
  joinDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  // Optional fields returned by the backend
  yearsOfExperience?: number;
  performanceScore?: number;
  location?: string;
}