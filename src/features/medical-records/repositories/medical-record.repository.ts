import { supabase } from '@/lib/supabase/client'
import type { MedicalRecord, MedicalRecordAttachment } from '@/types/database.types'
import type { MedicalRecordFormData } from '@/features/medical-records/schemas/medical-record.schema'

export const medicalRecordRepository = {
  async findByPatient(patientId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
      .from('medical_records')
      .select(
        '*, professional:profiles(*), procedures:medical_record_procedures(*, procedure:procedures(*)), attachments:medical_record_attachments(*)'
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as MedicalRecord[]
  },

  async findById(id: string): Promise<MedicalRecord | null> {
    const { data, error } = await supabase
      .from('medical_records')
      .select(
        '*, professional:profiles(*), procedures:medical_record_procedures(*, procedure:procedures(*)), attachments:medical_record_attachments(*)'
      )
      .eq('id', id)
      .single()
    if (error) throw error
    return data as MedicalRecord
  },

  async create(
    record: Omit<MedicalRecordFormData, 'procedure_ids'>,
    procedureIds?: string[]
  ): Promise<MedicalRecord> {
    const { procedure_ids: _, ...recordData } = record as MedicalRecordFormData
    const { data, error } = await supabase
      .from('medical_records')
      .insert(recordData)
      .select()
      .single()
    if (error) throw error

    if (procedureIds?.length) {
      const { error: procError } = await supabase.from('medical_record_procedures').insert(
        procedureIds.map((procedureId) => ({
          medical_record_id: data.id,
          procedure_id: procedureId,
        }))
      )
      if (procError) throw procError
    }

    return this.findById(data.id) as Promise<MedicalRecord>
  },

  async update(
    id: string,
    record: Partial<Omit<MedicalRecordFormData, 'procedure_ids'>>,
    procedureIds?: string[]
  ): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .update(record)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (procedureIds !== undefined) {
      await supabase.from('medical_record_procedures').delete().eq('medical_record_id', id)
      if (procedureIds.length) {
        await supabase.from('medical_record_procedures').insert(
          procedureIds.map((procedureId) => ({
            medical_record_id: id,
            procedure_id: procedureId,
          }))
        )
      }
    }

    return this.findById(data.id) as Promise<MedicalRecord>
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('medical_records').delete().eq('id', id)
    if (error) throw error
  },

  async addAttachment(
    recordId: string,
    file: File,
    userId?: string
  ): Promise<MedicalRecordAttachment> {
    const path = `${recordId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('medical-attachments')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('medical_record_attachments')
      .insert({
        medical_record_id: recordId,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: userId,
      })
      .select()
      .single()
    if (error) throw error
    return data as MedicalRecordAttachment
  },

  async getAttachmentUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('medical-attachments')
      .createSignedUrl(filePath, 3600) // 1 hour
    if (error) throw error
    return data.signedUrl
  },

  async getTotalAttachmentSize(): Promise<number> {
    const { data, error } = await supabase.rpc('get_total_attachment_size')
    if (error) throw error
    return data as number
  },
}
