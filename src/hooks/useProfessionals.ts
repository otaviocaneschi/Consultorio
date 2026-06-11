import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'

async function fetchProfessionals(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, role:roles!inner(*)')
    .in('roles.name', ['admin', 'professional'])
    .eq('is_active', true)
    .order('full_name')

  if (error) throw error
  return (data ?? []) as Profile[]
}

export function useProfessionals() {
  return useQuery({
    queryKey: ['professionals'],
    queryFn: fetchProfessionals,
    staleTime: 5 * 60 * 1000,
  })
}
