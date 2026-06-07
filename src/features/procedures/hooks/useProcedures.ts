import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { procedureRepository } from '@/features/procedures/repositories/procedure.repository'
import type { ProcedureFormData } from '@/features/procedures/schemas/procedure.schema'

export function useProcedures(activeOnly = false) {
  return useQuery({
    queryKey: ['procedures', activeOnly],
    queryFn: () => procedureRepository.findAll(activeOnly),
  })
}

export function useProcedureMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['procedures'] })

  return {
    create: useMutation({
      mutationFn: (data: ProcedureFormData) => procedureRepository.create(data),
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
