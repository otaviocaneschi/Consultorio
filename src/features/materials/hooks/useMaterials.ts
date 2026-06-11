import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Material } from '@/types/database.types'
import type { MaterialFormData } from '@/features/materials/schemas/material.schema'

export function useMaterials(activeOnly = false) {
  return useQuery({
    queryKey: ['materials', activeOnly],
    queryFn: async () => {
      let query = supabase.from('materials').select('*').order('name')
      if (activeOnly) {
        query = query.eq('is_active', true)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Material[]
    },
  })
}

export function useMaterialMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const { data: result, error } = await supabase
        .from('materials')
        .insert([data])
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MaterialFormData }) => {
      const { data: result, error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  return { create, update }
}
