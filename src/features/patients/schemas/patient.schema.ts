import { z } from 'zod'
import { validateCPF } from '@/utils/validators'

export const patientSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || validateCPF(val), 'CPF inválido'),
  rg: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  phone_secondary: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zip: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  health_insurance: z.string().optional(),
  health_insurance_number: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  allergies: z.string().optional(),
  medical_notes: z.string().optional(),
  primary_dentist_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  is_active: z.boolean().default(true),
})

export type PatientFormData = z.infer<typeof patientSchema>

