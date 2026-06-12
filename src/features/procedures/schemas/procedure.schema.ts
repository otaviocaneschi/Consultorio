import { z } from 'zod'

export const procedureSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  category: z.enum([
    'ozonioterapy',
    'lasertherapy',
    'evaluation',
    'follow_up',
    'general',
    'other',
  ]),
  duration_minutes: z.coerce.number().min(15).default(60).optional(),
  base_price: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  margin_percentage: z.coerce.number().min(0).max(100).default(100).optional(),
  is_active: z.boolean().default(true),
})

export type ProcedureFormData = z.infer<typeof procedureSchema>
