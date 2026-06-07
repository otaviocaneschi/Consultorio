import { patientRepository } from '@/features/patients/repositories/patient.repository'
import type { PatientFormData } from '@/features/patients/schemas/patient.schema'
import { supabase } from '@/lib/supabase/client'
import type { PaginationParams } from '@/types/common.types'
import type { PatientFilters } from '@/features/patients/repositories/patient.repository'

export const patientService = {
  list: (params: PaginationParams, filters?: PatientFilters) =>
    patientRepository.findAll(params, filters),

  getById: (id: string) => patientRepository.findById(id),

  create: (data: PatientFormData, userId?: string) =>
    patientRepository.create(data, userId),

  update: (id: string, data: Partial<PatientFormData>) =>
    patientRepository.update(id, data),

  remove: (id: string) => patientRepository.delete(id),

  async uploadPhoto(patientId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${patientId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('patient-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('patient-photos').getPublicUrl(path)
    await patientRepository.updatePhoto(patientId, data.publicUrl)
    return data.publicUrl
  },
}
