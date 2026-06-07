import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/features/notifications/services/notification.service'
import { useAuth } from '@/contexts/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getForUser(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  })
}

export function useUnreadCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: () => notificationService.getUnreadCount(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  })
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
  }

  return {
    markAsRead: useMutation({
      mutationFn: (id: string) => notificationService.markAsRead(id),
      onSuccess: invalidate,
    }),
    markAllAsRead: useMutation({
      mutationFn: () => notificationService.markAllAsRead(user!.id),
      onSuccess: invalidate,
    }),
  }
}
