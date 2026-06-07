import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { appointmentSchema, type AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'
import { usePatients } from '@/features/patients/hooks/usePatients'
import { useProcedures } from '@/features/procedures/hooks/useProcedures'
import { useAuth } from '@/contexts/AuthContext'
import { APPOINTMENT_STATUS_LABELS } from '@/types/enums'
import type { Appointment } from '@/types/database.types'

interface AppointmentFormProps {
  appointment?: Appointment
  defaultDate?: Date
  onSubmit: (data: AppointmentFormData) => void
  onDelete?: () => void
  isLoading?: boolean
}

export function AppointmentForm({
  appointment,
  defaultDate,
  onSubmit,
  onDelete,
  isLoading,
}: AppointmentFormProps) {
  const { profile } = useAuth()
  const { data: patientsData } = usePatients(1, 100)
  const { data: procedures = [] } = useProcedures(true)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id ?? '',
      professional_id: appointment?.professional_id ?? profile?.id ?? '',
      procedure_id: appointment?.procedure_id ?? null,
      scheduled_at: appointment?.scheduled_at
        ? format(new Date(appointment.scheduled_at), "yyyy-MM-dd'T'HH:mm")
        : defaultDate
          ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
          : '',
      duration_minutes: appointment?.duration_minutes ?? 60,
      status: appointment?.status ?? 'pending',
      notes: appointment?.notes ?? '',
      internal_notes: appointment?.internal_notes ?? '',
      cancellation_reason: appointment?.cancellation_reason ?? '',
    },
  })

  const status = form.watch('status')

  useEffect(() => {
    if (profile?.id && !appointment) {
      form.setValue('professional_id', profile.id)
    }
  }, [profile?.id, appointment, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patientsData?.data.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="procedure_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedimento</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                value={field.value ?? 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {procedures.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e hora *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (min)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {status === 'cancelled' && (
          <FormField
            control={form.control}
            name="cancellation_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo do cancelamento *</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between pt-2">
          {appointment && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              Excluir
            </Button>
          ) : (
            <div></div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : appointment ? 'Atualizar' : 'Agendar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}