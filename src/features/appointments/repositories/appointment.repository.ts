import { addMinutes, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database.types'
import type { AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'

export const appointmentRepository = {
  async findByDateRange(start: string, end: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      // Adicionamos !professional_id para tirar a ambiguidade do Supabase
      .select('*, patient:patients(*), procedure:procedures(*), professional:profiles!professional_id(*), materials:appointment_materials(material_id, quantity)')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .order('scheduled_at')
    if (error) throw error
    return (data ?? []) as Appointment[]
  },

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      // Adicionamos !professional_id aqui também
      .select('*, patient:patients(*), procedure:procedures(*), professional:profiles!professional_id(*), materials:appointment_materials(material_id, quantity)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Appointment
  },

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, procedure:procedures(*), professional:profiles!professional_id(*), materials:appointment_materials(quantity, material:materials(*))')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
    if (error) throw error
    return data as any as Appointment[]
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
    const { materials, ...payload } = appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...payload, created_by: userId })
      .select('*, patient:patients(*), procedure:procedures(*), materials:appointment_materials(material_id, quantity)')
      .single()
    if (error) throw error

    if (materials && materials.length > 0) {
      const { error: matError } = await supabase.from('appointment_materials').insert(
        materials.map((m) => ({
          appointment_id: data.id,
          material_id: m.material_id,
          quantity: m.quantity,
        }))
      )
      if (matError) throw matError
    }

    return data as Appointment
  },

  async update(id: string, appointment: Partial<AppointmentFormData>): Promise<Appointment> {
    const { materials, ...payload } = appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select('*, patient:patients(*), procedure:procedures(*), materials:appointment_materials(material_id, quantity)')
      .single()
    if (error) throw error

    if (materials !== undefined) {
      await supabase.from('appointment_materials').delete().eq('appointment_id', id)
      if (materials.length > 0) {
        const { error: matError } = await supabase.from('appointment_materials').insert(
          materials.map((m) => ({
            appointment_id: id,
            material_id: m.material_id,
            quantity: m.quantity,
          }))
        )
        if (matError) throw matError
      }
    }

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
    const { data, error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .select() // Forçamos o Supabase a nos devolver o que foi apagado

    if (error) throw error
    
    // Se a resposta vier vazia, o banco bloqueou a exclusão por falta de permissão
    if (!data || data.length === 0) {
      throw new Error('Acesso negado: Você não tem permissão para excluir agendamentos.')
    }
  },
}
