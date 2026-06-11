import { useQuery } from '@tanstack/react-query'
import { settingsService } from '@/features/settings/services/settings.service'

export function useClinicSettings() {
  return useQuery({
    queryKey: ['clinic-settings'],
    queryFn: () => settingsService.getClinicSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
