import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { procedureRepository } from '@/features/procedures/repositories/procedure.repository'
import type { ProcedureFormData } from '@/features/procedures/schemas/procedure.schema'
import { useAuth } from '@/contexts/AuthContext'

export function useProcedures(activeOnly = false) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['procedures', activeOnly, user?.id],
    queryFn: () => procedureRepository.findAll(activeOnly),
    enabled: !!user,
  })
}

export function useProcedureMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['procedures'] })

  return {
    create: useMutation({
      mutationFn: (data: ProcedureFormData) => procedureRepository.create(data, user?.id),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<ProcedureFormData> }) =>
        procedureRepository.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => procedureRepository.delete(id),
      onSuccess: invalidate,
    }),
  }
}
