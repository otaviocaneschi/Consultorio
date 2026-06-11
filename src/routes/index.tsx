import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleGuard } from '@/routes/RoleGuard'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { PatientsPage } from '@/features/patients/pages/PatientsPage'
import { PatientDetailPage } from '@/features/patients/pages/PatientDetailPage'
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage'
import { ProceduresPage } from '@/features/procedures/pages/ProceduresPage'
import { MedicalRecordPage } from '@/features/medical-records/pages/MedicalRecordPage'
import { FinancialPage } from '@/features/financial/pages/FinancialPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { MaterialsPage } from '@/features/materials/pages/MaterialsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'pacientes', element: <PatientsPage /> },
          { path: 'pacientes/:id', element: <PatientDetailPage /> },
          { path: 'pacientes/:id/prontuario', element: <MedicalRecordPage /> },
          { path: 'agenda', element: <AppointmentsPage /> },
          { path: 'procedimentos', element: <ProceduresPage /> },
          { path: 'financeiro', element: <FinancialPage /> },
          { path: 'materiais', element: <MaterialsPage /> },
          { path: 'relatorios', element: <ReportsPage /> },
          {
            path: 'usuarios',
            element: (
              <RoleGuard adminOnly>
                <UsersPage />
              </RoleGuard>
            ),
          },
          { path: 'configuracoes', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
