import { supabase } from '@/lib/supabase/client'
import type { ClinicSettings } from '@/types/database.types'

export const settingsService = {
  async getClinicSettings(): Promise<ClinicSettings | null> {
    const { data, error } = await supabase.from('clinic_settings').select('*').limit(1).single()
    if (error) throw error
    return data as ClinicSettings
  },

  async updateClinicSettings(
    id: string,
    settings: Partial<ClinicSettings>
  ): Promise<ClinicSettings> {
    const { data, error } = await supabase
      .from('clinic_settings')
      .update(settings)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ClinicSettings
  },

  async uploadLogo(file: File): Promise<string> {
    const path = `logo/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('clinic-assets').upload(path, file, {
      upsert: true,
    })
    if (error) throw error
    const { data } = supabase.storage.from('clinic-assets').getPublicUrl(path)
    return data.publicUrl
  },
}
