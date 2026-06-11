import { z } from 'zod'

export const medicalRecordSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional().nullable(),
  professional_id: z.string().uuid(),
  chief_complaint: z.string().optional(),
  anamnesis: z.string().optional(),
  physical_examination: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  evolution: z.string().optional(),
  prescriptions: z.string().optional(),
  procedure_ids: z.array(z.string().uuid()).optional(),
  material_ids: z.array(z.string().uuid()).optional(),
  is_confidential: z.boolean().default(false),
})

export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>
