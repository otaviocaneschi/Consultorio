import { Users, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDashboardStats,
  useTodayAppointments,
  useRecentPatients,
  useAppointmentTrend,
  useTopProcedures,
} from '@/features/dashboard/hooks/useDashboardStats'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { APPOINTMENT_STATUS_LABELS } from '@/types/enums'
import type { AppointmentStatus } from '@/types/enums'

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: todayAppts = [] } = useTodayAppointments()
  const { data: recentPatients = [] } = useRecentPatients()
  const { data: trend = [] } = useAppointmentTrend()
  const { data: topProcedures = [] } = useTopProcedures()

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da clínica Marcela Caneschi"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de pacientes"
          value={String(stats?.total_patients ?? 0)}
          icon={Users}
          description={`${stats?.active_patients ?? 0} ativos`}
        />
        <StatCard
          title="Atendimentos hoje"
          value={String(stats?.appointments_today ?? 0)}
          icon={Calendar}
          description={`${stats?.appointments_week ?? 0} esta semana`}
        />
        <StatCard
          title="Faturamento mensal"
          value={formatCurrency(stats?.monthly_revenue ?? 0)}
          icon={DollarSign}
          description={`Despesas: ${formatCurrency(stats?.monthly_expenses ?? 0)}`}
        />
        <StatCard
          title="Pendências"
          value={String((stats?.pending_transactions ?? 0) + (stats?.overdue_transactions ?? 0))}
          icon={AlertTriangle}
          description={`${stats?.overdue_transactions ?? 0} atrasadas`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procedimentos mais realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProcedures} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="procedure_name" width={120} />
                <Tooltip />
                <Bar dataKey="total_count" fill="#14B8A6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Agenda do dia</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum atendimento agendado para hoje.
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppts.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{apt.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.procedure?.name ?? 'Consulta'} — {formatDateTime(apt.scheduled_at)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {APPOINTMENT_STATUS_LABELS[apt.status as AppointmentStatus]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos cadastros</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {recentPatients.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="font-medium">{p.full_name}</span>
                    <span className="text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
