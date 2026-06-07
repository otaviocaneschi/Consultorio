import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: ['dashboard', 'today-appointments'],
    queryFn: () => dashboardService.getTodayAppointments(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecentPatients() {
  return useQuery({
    queryKey: ['dashboard', 'recent-patients'],
    queryFn: () => dashboardService.getRecentPatients(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAppointmentTrend() {
  return useQuery({
    queryKey: ['dashboard', 'appointment-trend'],
    queryFn: () => dashboardService.getAppointmentTrend(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTopProcedures() {
  return useQuery({
    queryKey: ['dashboard', 'top-procedures'],
    queryFn: () => dashboardService.getTopProcedures(),
    staleTime: 5 * 60 * 1000,
  })
}
