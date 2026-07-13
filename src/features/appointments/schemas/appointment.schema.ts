import { z } from 'zod'

export const appointmentSchema = z.object({
  patient_id: z.string().uuid('Selecione um paciente'),
  professional_id: z.string().uuid('Selecione um profissional'),
  procedure_ids: z.array(z.string().uuid()).optional().default([]),
  scheduled_at: z.string().min(1, 'Data e hora são obrigatórias'),
  duration_minutes: z.coerce.number().min(15),
  status: z.enum([
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ]),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  cancellation_reason: z.string().optional(),
  materials: z.array(z.object({
    material_id: z.string().uuid(),
    quantity: z.number().min(1)
  })).optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>
