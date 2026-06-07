import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientService } from '@/features/patients/services/patient.service'
import type { PatientFilters } from '@/features/patients/repositories/patient.repository'
import type { PatientFormData } from '@/features/patients/schemas/patient.schema'
import { useAuth } from '@/contexts/AuthContext'

export function usePatients(
  page: number,
  pageSize: number,
  search?: string,
  filters?: PatientFilters
) {
  return useQuery({
    queryKey: ['patients', page, pageSize, search, filters],
    queryFn: () => patientService.list({ page, pageSize, search }, filters),
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getById(id!),
    enabled: !!id,
  })
}

export function usePatientMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] })
    queryClient.invalidateQueries({ queryKey: ['patient'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const create = useMutation({
    mutationFn: (data: PatientFormData) => patientService.create(data, user?.id),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientFormData> }) =>
      patientService.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => patientService.remove(id),
    onSuccess: invalidate,
  })

  const uploadPhoto = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      patientService.uploadPhoto(id, file),
    onSuccess: invalidate,
  })

  return { create, update, remove, uploadPhoto }
}
