import { Badge } from '@/components/ui/badge'
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from '@/types/enums'

const variantMap: Record<AppointmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'default',
  confirmed: 'default',
  in_progress: 'secondary',
  completed: 'outline',
  cancelled: 'destructive',
  no_show: 'destructive',
}

interface StatusBadgeProps {
  status: AppointmentStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={variantMap[status]} style={{ backgroundColor: status === 'confirmed' ? '#22C55E' : undefined }}>
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
