import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { medicalRecordRepository } from '@/features/medical-records/repositories/medical-record.repository'
import type { MedicalRecordFormData } from '@/features/medical-records/schemas/medical-record.schema'
import { useAuth } from '@/contexts/AuthContext'

export function useMedicalRecords(patientId: string | undefined) {
  return useQuery({
    queryKey: ['medical-records', patientId],
    queryFn: () => medicalRecordRepository.findByPatient(patientId!),
    enabled: !!patientId,
  })
}

export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage-usage'],
    queryFn: () => medicalRecordRepository.getTotalAttachmentSize(),
  })
}

export function useMedicalRecordMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidate = (patientId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['medical-records', patientId] })
  }

  return {
    create: useMutation({
      mutationFn: ({
        data,
        procedureIds,
      }: {
        data: Omit<MedicalRecordFormData, 'procedure_ids'>
        procedureIds?: string[]
      }) => medicalRecordRepository.create(data, procedureIds),
      onSuccess: (_, vars) => invalidate(vars.data.patient_id),
    }),
    update: useMutation({
      mutationFn: ({
        id,
        data,
        procedureIds,
      }: {
        id: string
        data: Partial<Omit<MedicalRecordFormData, 'procedure_ids'>>
        procedureIds?: string[]
        patientId: string
      }) => medicalRecordRepository.update(id, data, procedureIds),
      onSuccess: (_, vars) => invalidate(vars.patientId),
    }),
    remove: useMutation({
      mutationFn: ({ id, patientId: pid }: { id: string; patientId: string }) =>
        medicalRecordRepository.delete(id).then(() => pid),
      onSuccess: (pid) => invalidate(pid),
    }),
    uploadAttachment: useMutation({
      mutationFn: ({ recordId, file, patientId }: { recordId: string; file: File; patientId: string }) =>
        medicalRecordRepository.addAttachment(recordId, file, user?.id).then(() => patientId),
      onSuccess: (patientId) => invalidate(patientId),
    }),
  }
}
