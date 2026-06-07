import { addMinutes, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database.types'
import type { AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'

export const appointmentRepository = {
  async findByDateRange(start: string, end: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), procedure:procedures(*), professional:profiles(*)')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .order('scheduled_at')
    if (error) throw error
    return (data ?? []) as Appointment[]
  },

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), procedure:procedures(*), professional:profiles(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Appointment
  },

  async checkConflict(
    professionalId: string,
    scheduledAt: string,
    durationMinutes: number,
    excludeId?: string
  ): Promise<boolean> {
    const start = parseISO(scheduledAt)
    const end = addMinutes(start, durationMinutes)

    let query = supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes')
      .eq('professional_id', professionalId)
      .not('status', 'in', '("cancelled","no_show")')
      .gte('scheduled_at', addMinutes(start, -480).toISOString())
      .lte('scheduled_at', addMinutes(end, 480).toISOString())

    if (excludeId) query = query.neq('id', excludeId)

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).some((apt) => {
      const aptStart = parseISO(apt.scheduled_at)
      const aptEnd = addMinutes(aptStart, apt.duration_minutes)
      return start < aptEnd && end > aptStart
    })
  },

  async create(appointment: AppointmentFormData, userId?: string): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appointment, created_by: userId })
      .select('*, patient:patients(*), procedure:procedures(*)')
      .single()
    if (error) throw error
    return data as Appointment
  },

  async update(id: string, appointment: Partial<AppointmentFormData>): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointment)
      .eq('id', id)
      .select('*, patient:patients(*), procedure:procedures(*)')
      .single()
    if (error) throw error
    return data as Appointment
  },

  async updateSchedule(
    id: string,
    scheduledAt: string,
    durationMinutes: number
  ): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ scheduled_at: scheduledAt, duration_minutes: durationMinutes })
      .eq('id', id)
      .select('*, patient:patients(*), procedure:procedures(*)')
      .single()
    if (error) throw error
    return data as Appointment
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  },
}
