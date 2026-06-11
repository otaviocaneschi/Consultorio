import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useClinicSettings } from '@/features/settings/hooks/useClinicSettings'

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const { data: clinicSettings } = useClinicSettings()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        clinicName={clinicSettings?.clinic_name}
        professionalName={profile?.full_name}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={profile?.full_name}
          userEmail={profile?.email}
          userAvatar={profile?.avatar_url ?? undefined}
          onSignOut={signOut}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

