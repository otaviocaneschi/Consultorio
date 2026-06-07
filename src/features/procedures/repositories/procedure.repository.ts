import { supabase } from '@/lib/supabase/client'
import type { Procedure } from '@/types/database.types'
import type { ProcedureFormData } from '@/features/procedures/schemas/procedure.schema'

export const procedureRepository = {
  async findAll(activeOnly = false): Promise<Procedure[]> {
    let query = supabase.from('procedures').select('*').order('name')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Procedure[]
  },

  async findById(id: string): Promise<Procedure | null> {
    const { data, error } = await supabase.from('procedures').select('*').eq('id', id).single()
    if (error) throw error
    return data as Procedure
  },

  async create(procedure: ProcedureFormData): Promise<Procedure> {
    const { data, error } = await supabase.from('procedures').insert(procedure).select().single()
    if (error) throw error
    return data as Procedure
  },

  async update(id: string, procedure: Partial<ProcedureFormData>): Promise<Procedure> {
    const { data, error } = await supabase
      .from('procedures')
      .update(procedure)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Procedure
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('procedures').delete().eq('id', id)
    if (error) throw error
  },
}
