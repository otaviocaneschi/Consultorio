import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import { useAuth } from '@/contexts/AuthContext'

export function useDashboardStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'stats', user?.id],
    queryFn: () => dashboardService.getStats(user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })
}

export function useTodayAppointments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'today-appointments', user?.id],
    queryFn: () => dashboardService.getTodayAppointments(user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })
}

export function useRecentPatients() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'recent-patients', user?.id],
    queryFn: () => dashboardService.getRecentPatients(user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })
}

export function useAppointmentTrend() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard', 'appointment-trend', user?.id],
    queryFn: () => dashboardService.getAppointmentTrend(user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })
}

export function useTopProcedures() {
  return useQuery({
    queryKey: ['dashboard', 'top-procedures'],
    queryFn: () => dashboardService.getTopProcedures(),
    staleTime: 5 * 60 * 1000,
  })
}
