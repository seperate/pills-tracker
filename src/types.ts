export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: number; // times per day
  timeSlots: string[];
  notes?: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
  medicationName: string;
  medicationDosage: string;
  username: string;
}

export interface User {
  username: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface StaticMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: number;
  timeSlots: string[];
  isActive: boolean;
  notes?: string;
}