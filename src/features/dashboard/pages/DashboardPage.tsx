import { Users, Calendar, DollarSign, AlertTriangle, TrendingUp, Activity } from 'lucide-react'
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
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { APPOINTMENT_STATUS_LABELS } from '@/types/enums'
import type { AppointmentStatus } from '@/types/enums'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: todayAppts = [] } = useTodayAppointments()
  const { data: recentPatients = [] } = useRecentPatients()
  const { data: trend = [] } = useAppointmentTrend()
  const { data: topProcedures = [] } = useTopProcedures()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Profissional'
  const greeting = getGreeting()

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está o resumo do seu dia e dos seus atendimentos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Meus pacientes"
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
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Evolução de atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum atendimento concluído nos últimos 30 dias.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <CardTitle className="text-base">Procedimentos mais realizados</CardTitle>
          </CardHeader>
          <CardContent>
            {topProcedures.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum procedimento registrado ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProcedures} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="procedure_name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total_count" fill="#14B8A6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Minha agenda do dia</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum atendimento agendado para hoje.
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppts.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50"
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
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Últimos cadastros</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
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
