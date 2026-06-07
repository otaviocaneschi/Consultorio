import { useState } from 'react'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { AppointmentCalendar } from '@/features/appointments/components/AppointmentCalendar'
import { AppointmentForm } from '@/features/appointments/components/AppointmentForm'
import { useAppointments, useAppointmentMutations } from '@/features/appointments/hooks/useAppointments'
import type { Appointment } from '@/types/database.types'
import type { AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'

export function AppointmentsPage() {
  const rangeStart = startOfMonth(addMonths(new Date(), -1)).toISOString()
  const rangeEnd = endOfMonth(addMonths(new Date(), 2)).toISOString()

  const { data: appointments = [], isLoading } = useAppointments(rangeStart, rangeEnd)
  const { create, update, reschedule } = useAppointmentMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const handleSubmit = async (formData: AppointmentFormData) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: formData })
        toast.success('Agendamento atualizado!')
      } else {
        await create.mutateAsync(formData)
        toast.success('Agendamento criado!')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
    }
  }

  const handleEventDrop = async (
    appointmentId: string,
    newStart: Date,
    durationMinutes: number
  ) => {
    const apt = appointments.find((a) => a.id === appointmentId)
    if (!apt) return
    try {
      await reschedule.mutateAsync({
        id: appointmentId,
        scheduledAt: newStart.toISOString(),
        durationMinutes,
        professionalId: apt.professional_id,
      })
      toast.success('Agendamento reagendado!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Conflito de horário')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gerencie os agendamentos da clínica"

      >
        <Button
          onClick={() => {
            setEditing(null)
            setSelectedDate(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo agendamento
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Carregando agenda...
        </div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          onDateSelect={(date) => {
            setSelectedDate(date)
            setEditing(null)
            setDialogOpen(true)
          }}
          onEventClick={(apt) => {
            setEditing(apt)
            setDialogOpen(true)
          }}
          onEventDrop={handleEventDrop}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar agendamento' : 'Novo agendamento'}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editing ?? undefined}
            defaultDate={selectedDate}
            onSubmit={handleSubmit}
            isLoading={create.isPending || update.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
