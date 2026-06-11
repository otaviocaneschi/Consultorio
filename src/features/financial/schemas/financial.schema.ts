import { z } from 'zod'

export const financialSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(2, 'Descrição é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled', 'partial']).default('pending'),
  category: z.string().optional(),
  due_date: z.string().optional(),
  paid_at: z.string().optional().nullable(),
  payment_method: z.string().optional(),
  patient_id: z.string().uuid().optional().nullable(),
  appointment_id: z.string().uuid().optional().nullable(),
  split_type: z.enum(['100_percent', '50_50', 'custom_margin']).default('100_percent'),
  shared_with_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

export type FinancialFormData = z.infer<typeof financialSchema>
