import type {
  AppointmentStatus,
  GenderType,
  NotificationType,
  ProcedureCategory,
  TransactionStatus,
  TransactionType,
} from './enums'

export interface Role {
  id: string
  name: string
  display_name: string
  description: string | null
  permissions: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  role_id: string
  full_name: string
  email: string
  phone: string | null
  cpf: string | null
  specialty: string | null
  license_number: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  role?: Role
}

export interface ClinicSettings {
  id: string
  clinic_name: string
  trade_name: string | null
  cnpj: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string
  address_state: string
  address_zip: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  working_hours: Record<string, { open: string | null; close: string | null; enabled: boolean }>
  default_appointment_duration: number
  timezone: string
  currency: string
  appointment_reminder_days: number
  return_visit_days: number
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  full_name: string
  cpf: string | null
  rg: string | null
  birth_date: string | null
  gender: GenderType | null
  email: string | null
  phone: string
  phone_secondary: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  health_insurance: string | null
  health_insurance_number: string | null
  weight: string | null
  height: string | null
  allergies: string | null
  medical_notes: string | null
  photo_url: string | null
  last_appointment_at: string | null
  is_active: boolean
  primary_dentist_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  primary_dentist?: Profile
}

export interface Procedure {
  id: string
  name: string
  description: string | null
  category: ProcedureCategory
  duration_minutes: number
  base_price: number
  margin_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  professional_id: string
  procedure_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus
  notes: string | null
  internal_notes: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  procedure?: Procedure
  professional?: Profile
}

export interface MedicalRecord {
  id: string
  patient_id: string
  appointment_id: string | null
  professional_id: string
  chief_complaint: string | null
  anamnesis: string | null
  physical_examination: string | null
  diagnosis: string | null
  treatment_plan: string | null
  evolution: string | null
  prescriptions: string | null
  vital_signs: Record<string, unknown>
  is_confidential: boolean
  created_at: string
  updated_at: string
  professional?: Profile
  procedures?: MedicalRecordProcedure[]
  materials?: MedicalRecordMaterial[]
  attachments?: MedicalRecordAttachment[]
}

export interface MedicalRecordProcedure {
  id: string
  medical_record_id: string
  procedure_id: string
  quantity: number
  unit_price: number | null
  notes: string | null
  performed_at: string
  created_at: string
  procedure?: Procedure
}

export interface MedicalRecordAttachment {
  id: string
  medical_record_id: string
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  description: string | null
  uploaded_by: string | null
  created_at: string
}

export interface Material {
  id: string
  name: string
  cost: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicalRecordMaterial {
  id: string
  medical_record_id: string
  material_id: string
  cost_at_time: number
  created_at: string
  material?: Material
}

export interface FinancialTransaction {
  id: string
  patient_id: string | null
  appointment_id: string | null
  type: TransactionType
  status: TransactionStatus
  split_type: '100_percent' | '50_50' | 'custom_margin'
  amount: number
  split_amount: number | null
  description: string
  category: string | null
  due_date: string | null
  paid_at: string | null
  payment_method: string | null
  reference_number: string | null
  notes: string | null
  created_by: string | null
  shared_with_id: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  shared_with?: Profile
}

export interface Notification {
  id: string
  user_id: string | null
  patient_id: string | null
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  read_at: string | null
  scheduled_at: string | null
  sent_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  total_patients: number
  active_patients: number
  appointments_today: number
  appointments_week: number
  monthly_revenue: number
  monthly_expenses: number
  pending_transactions: number
  overdue_transactions: number
}

export interface MonthlyRevenue {
  month: string
  income: number
  expense: number
}

export interface TopProcedure {
  procedure_name: string
  total_count: number
}
