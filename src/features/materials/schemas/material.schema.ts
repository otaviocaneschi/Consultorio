import { z } from 'zod'

export const materialSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cost: z.coerce.number().min(0, 'Custo não pode ser negativo'),
  is_active: z.boolean().default(true),
})

export type MaterialFormData = z.infer<typeof materialSchema>
