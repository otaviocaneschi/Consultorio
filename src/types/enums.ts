export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type TransactionType = 'income' | 'expense'

export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial'

export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'birthday'
  | 'payment_overdue'
  | 'payment_received'
  | 'system'
  | 'general'

export type ProcedureCategory =
  | 'ozonioterapy'
  | 'lasertherapy'
  | 'evaluation'
  | 'follow_up'
  | 'general'
  | 'other'

export type RoleName = 'admin' | 'receptionist' | 'professional'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
}

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#0EA5E9',
  confirmed: '#22C55E',
  in_progress: '#EAB308',
  completed: '#94A3B8',
  cancelled: '#EF4444',
  no_show: '#F97316',
}

export const GENDER_LABELS: Record<GenderType, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  prefer_not_to_say: 'Prefiro não informar',
}

export const PROCEDURE_CATEGORY_LABELS: Record<ProcedureCategory, string> = {
  ozonioterapy: 'Ozonioterapia',
  lasertherapy: 'Laserterapia',
  evaluation: 'Avaliação Inicial',
  follow_up: 'Sessão de Retorno',
  general: 'Geral',
  other: 'Outros',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
  partial: 'Parcial',
}
