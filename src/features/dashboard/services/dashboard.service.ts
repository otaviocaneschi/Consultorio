import { supabase } from '@/lib/supabase/client'
import type { DashboardStats, MonthlyRevenue, TopProcedure } from '@/types/database.types'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const now = new Date()
    const todayStart = startOfDay(now).toISOString()
    const todayEnd = endOfDay(now).toISOString()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()

    const [
      patientsRes,
      activePatientsRes,
      todayApptsRes,
      weekApptsRes,
      incomeRes,
      expenseRes,
      pendingRes,
      overdueRes,
    ] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', todayStart)
        .lte('scheduled_at', todayEnd)
        .not('status', 'in', '("cancelled","no_show")'),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', weekStart)
        .lte('scheduled_at', weekEnd)
        .not('status', 'in', '("cancelled","no_show")'),
      supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'income')
        .eq('status', 'paid')
        .gte('paid_at', monthStart)
        .lte('paid_at', monthEnd),
      supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'expense')
        .eq('status', 'paid')
        .gte('paid_at', monthStart)
        .lte('paid_at', monthEnd),
      supabase
        .from('financial_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('financial_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'overdue'),
    ])

    const monthlyRevenue = (incomeRes.data ?? []).reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )
    const monthlyExpenses = (expenseRes.data ?? []).reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

    return {
      total_patients: patientsRes.count ?? 0,
      active_patients: activePatientsRes.count ?? 0,
      appointments_today: todayApptsRes.count ?? 0,
      appointments_week: weekApptsRes.count ?? 0,
      monthly_revenue: monthlyRevenue,
      monthly_expenses: monthlyExpenses,
      pending_transactions: pendingRes.count ?? 0,
      overdue_transactions: overdueRes.count ?? 0,
    }
  },

  async getTodayAppointments() {
    const now = new Date()
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(full_name, phone), procedure:procedures(name)')
      .gte('scheduled_at', startOfDay(now).toISOString())
      .lte('scheduled_at', endOfDay(now).toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .order('scheduled_at')
      .limit(10)
    if (error) throw error
    return data ?? []
  },

  async getRecentPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) throw error
    return data ?? []
  },

  async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
    const { data, error } = await supabase.from('v_monthly_revenue').select('*')
    if (error) {
      // Fallback if view not available
      return []
    }
    return (data ?? []) as MonthlyRevenue[]
  },

  async getTopProcedures(): Promise<TopProcedure[]> {
    const { data, error } = await supabase.from('v_top_procedures').select('*').limit(5)
    if (error) return []
    return (data ?? []) as TopProcedure[]
  },

  async getAppointmentTrend() {
    const { data, error } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'completed')
    if (error) throw error

    const byDay: Record<string, number> = {}
    for (const apt of data ?? []) {
      const day = apt.scheduled_at.split('T')[0]
      byDay[day] = (byDay[day] ?? 0) + 1
    }
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
}
