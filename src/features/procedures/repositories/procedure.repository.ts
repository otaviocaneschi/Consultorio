import { supabase } from '@/lib/supabase/client'
import type { Procedure } from '@/types/database.types'
import type { ProcedureFormData } from '@/features/procedures/schemas/procedure.schema'

export const procedureRepository = {
  async findAll(activeOnly = false): Promise<Procedure[]> {
    let query = supabase.from('procedures').select('*').order('name')
    if (activeOnly) query = query.eq('is_active', true)
    // RLS handles filtering by owner_id automatically
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Procedure[]
  },

  async findById(id: string): Promise<Procedure | null> {
    const { data, error } = await supabase.from('procedures').select('*').eq('id', id).single()
    if (error) throw error
    return data as Procedure
  },

  async create(procedure: ProcedureFormData, ownerId?: string): Promise<Procedure> {
    const { data, error } = await supabase
      .from('procedures')
      .insert({ ...procedure, owner_id: ownerId })
      .select()
      .single()
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
