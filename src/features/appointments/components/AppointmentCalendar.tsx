import { useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { APPOINTMENT_STATUS_COLORS } from '@/types/enums'
import type { Appointment } from '@/types/database.types'
import { addMinutes, parseISO } from 'date-fns'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onDateSelect: (date: Date) => void
  onEventClick: (appointment: Appointment) => void
  onEventDrop: (appointmentId: string, newStart: Date, durationMinutes: number) => void
}

export function AppointmentCalendar({
  appointments,
  onDateSelect,
  onEventClick,
  onEventDrop,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)

  const events = useMemo(
    () =>
      appointments.map((apt) => ({
        id: apt.id,
        title: apt.patient?.full_name ?? 'Paciente',
        start: apt.scheduled_at,
        end: addMinutes(parseISO(apt.scheduled_at), apt.duration_minutes).toISOString(),
        backgroundColor: APPOINTMENT_STATUS_COLORS[apt.status],
        borderColor: APPOINTMENT_STATUS_COLORS[apt.status],
        extendedProps: { appointment: apt },
      })),
    [appointments]
  )

  const handleSelect = useCallback(
    (info: DateSelectArg) => onDateSelect(info.start),
    [onDateSelect]
  )

  const handleClick = useCallback(
    (info: EventClickArg) => {
      const apt = info.event.extendedProps.appointment as Appointment
      onEventClick(apt)
    },
    [onEventClick]
  )

  const handleDrop = useCallback(
    (info: EventDropArg) => {
      const apt = info.event.extendedProps.appointment as Appointment
      onEventDrop(apt.id, info.event.start!, apt.duration_minutes)
    },
    [onEventDrop]
  )

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm [&_.fc]:font-sans">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={ptBrLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        selectable
        editable
        events={events}
        select={handleSelect}
        eventClick={handleClick}
        eventDrop={handleDrop}
        height="auto"
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6],
          startTime: '08:00',
          endTime: '18:00',
        }}
      />
    </div>
  )
}
