import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Material } from '@/types/database.types'
import type { MaterialFormData } from '@/features/materials/schemas/material.schema'
import { useAuth } from '@/contexts/AuthContext'

export function useMaterials(activeOnly = false) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['materials', activeOnly],
    queryFn: async () => {
      let query = supabase.from('materials').select('*').order('name')
      if (activeOnly) {
        query = query.eq('is_active', true)
      }
      // RLS handles filtering by owner_id automatically
      const { data, error } = await query
      if (error) throw error
      return data as Material[]
    },
    enabled: !!user,
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

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  return { create, update, remove }
}
