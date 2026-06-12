import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentService } from '@/features/appointments/services/appointment.service'
import type { AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'
import { useAuth } from '@/contexts/AuthContext'

export function useAppointments(start: string, end: string) {
  return useQuery({
    queryKey: ['appointments', start, end],
    queryFn: () => appointmentService.getByDateRange(start, end),
    enabled: !!start && !!end,
  })
}

export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () => appointmentService.getByPatientId(patientId),
    enabled: !!patientId,
  })
}

export function useAppointmentMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return {
    create: useMutation({
      mutationFn: (data: AppointmentFormData) => appointmentService.create(data, user?.id),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentFormData> }) =>
        appointmentService.update(id, data),
      onSuccess: invalidate,
    }),
    reschedule: useMutation({
      mutationFn: ({
        id,
        scheduledAt,
        durationMinutes,
        professionalId,
      }: {
        id: string
        scheduledAt: string
        durationMinutes: number
        professionalId: string
      }) => appointmentService.reschedule(id, scheduledAt, durationMinutes, professionalId),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => appointmentService.remove(id),
      onSuccess: invalidate,
    }),
  }
}
