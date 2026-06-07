import { supabase } from '@/lib/supabase/client'
import type { Profile, Role } from '@/types/database.types'

export const userRepository = {
  async findAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .order('full_name')
    if (error) throw error
    return (data ?? []) as Profile[]
  },

  async findRoles(): Promise<Role[]> {
    const { data, error } = await supabase.from('roles').select('*').order('name')
    if (error) throw error
    return (data ?? []) as Role[]
  },

  async updateProfile(
    id: string,
    updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'role_id' | 'is_active' | 'specialty'>>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('*, role:roles(*)')
      .single()
    if (error) throw error
    return data as Profile
  },
}
