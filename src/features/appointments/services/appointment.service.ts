import { appointmentRepository } from '@/features/appointments/repositories/appointment.repository'
import type { AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'

export const appointmentService = {
  getByDateRange: (start: string, end: string) =>
    appointmentRepository.findByDateRange(start, end),

  getById: (id: string) => appointmentRepository.findById(id),

  async create(data: AppointmentFormData, userId?: string) {
    const hasConflict = await appointmentRepository.checkConflict(
      data.professional_id,
      data.scheduled_at,
      data.duration_minutes
    )
    if (hasConflict) {
      throw new Error('Conflito de horário com outro agendamento')
    }
    return appointmentRepository.create(data, userId)
  },

  async update(id: string, data: Partial<AppointmentFormData>) {
    if (data.professional_id && data.scheduled_at && data.duration_minutes) {
      const hasConflict = await appointmentRepository.checkConflict(
        data.professional_id,
        data.scheduled_at,
        data.duration_minutes,
        id
      )
      if (hasConflict) {
        throw new Error('Conflito de horário com outro agendamento')
      }
    }
    return appointmentRepository.update(id, data)
  },

  async reschedule(id: string, scheduledAt: string, durationMinutes: number, professionalId: string) {
    const hasConflict = await appointmentRepository.checkConflict(
      professionalId,
      scheduledAt,
      durationMinutes,
      id
    )
    if (hasConflict) {
      throw new Error('Conflito de horário com outro agendamento')
    }
    return appointmentRepository.updateSchedule(id, scheduledAt, durationMinutes)
  },

  remove: (id: string) => appointmentRepository.delete(id),
}
