import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  financialRepository,
  type FinancialFilters,
} from '@/features/financial/repositories/financial.repository'
import type { FinancialFormData } from '@/features/financial/schemas/financial.schema'
import { useAuth } from '@/contexts/AuthContext'

export function useFinancialTransactions(filters?: FinancialFilters) {
  return useQuery({
    queryKey: ['financial', filters],
    queryFn: () => financialRepository.findAll(filters),
  })
}

export function useFinancialSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['financial-summary', startDate, endDate],
    queryFn: () => financialRepository.getSummary(startDate, endDate),
  })
}

export function useFinancialMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['financial'] })
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return {
    create: useMutation({
      mutationFn: (data: FinancialFormData) => financialRepository.create(data, user?.id),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<FinancialFormData> }) =>
        financialRepository.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => financialRepository.delete(id),
      onSuccess: invalidate,
    }),
  }
}
