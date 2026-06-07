import { supabase } from '@/lib/supabase/client'
import type { FinancialTransaction } from '@/types/database.types'
import type { FinancialFormData } from '@/features/financial/schemas/financial.schema'

export interface FinancialFilters {
  type?: 'income' | 'expense'
  status?: string
  startDate?: string
  endDate?: string
}

export const financialRepository = {
  async findAll(filters?: FinancialFilters): Promise<FinancialTransaction[]> {
    let query = supabase
      .from('financial_transactions')
      .select('*, patient:patients(id, full_name)')
      .order('created_at', { ascending: false })

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.startDate) query = query.gte('due_date', filters.startDate)
    if (filters?.endDate) query = query.lte('due_date', filters.endDate)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as FinancialTransaction[]
  },

  async create(transaction: FinancialFormData, userId?: string): Promise<FinancialTransaction> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({ ...transaction, created_by: userId })
      .select('*, patient:patients(id, full_name)')
      .single()
    if (error) throw error
    return data as FinancialTransaction
  },

  async update(
    id: string,
    transaction: Partial<FinancialFormData>
  ): Promise<FinancialTransaction> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(transaction)
      .eq('id', id)
      .select('*, patient:patients(id, full_name)')
      .single()
    if (error) throw error
    return data as FinancialTransaction
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id)
    if (error) throw error
  },

  async getSummary(startDate?: string, endDate?: string) {
    let query = supabase.from('financial_transactions').select('type, status, amount')
    if (startDate) query = query.gte('due_date', startDate)
    if (endDate) query = query.lte('due_date', endDate)

    const { data, error } = await query
    if (error) throw error

    const transactions = data ?? []
    return {
      totalIncome: transactions
        .filter((t) => t.type === 'income' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalExpense: transactions
        .filter((t) => t.type === 'expense' && t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      pending: transactions.filter((t) => t.status === 'pending').length,
      overdue: transactions.filter((t) => t.status === 'overdue').length,
    }
  },
}
