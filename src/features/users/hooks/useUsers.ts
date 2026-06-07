import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userRepository } from '@/features/users/repositories/user.repository'
import type { Profile } from '@/types/database.types'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userRepository.findAll(),
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => userRepository.findRoles(),
  })
}

export function useUserMutations() {
  const queryClient = useQueryClient()

  return {
    update: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string
        data: Partial<Pick<Profile, 'full_name' | 'phone' | 'role_id' | 'is_active' | 'specialty'>>
      }) => userRepository.updateProfile(id, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    }),
  }
}
