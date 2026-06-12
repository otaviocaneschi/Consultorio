import { supabase } from '@/lib/supabase/client'
import type { DashboardStats, MonthlyRevenue, TopProcedure } from '@/types/database.types'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export const dashboardService = {
  async getStats(userId?: string): Promise<DashboardStats> {
    const now = new Date()
    const todayStart = startOfDay(now).toISOString()
    const todayEnd = endOfDay(now).toISOString()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()

    // Patients: own patients + shared (primary_dentist_id IS NULL)
    let patientsQuery = supabase.from('patients').select('id', { count: 'exact', head: true })
    let activePatientsQuery = supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true)
    if (userId) {
      patientsQuery = patientsQuery.or(`primary_dentist_id.eq.${userId},primary_dentist_id.is.null`)
      activePatientsQuery = activePatientsQuery.or(`primary_dentist_id.eq.${userId},primary_dentist_id.is.null`)
    }

    // Appointments: only this professional's
    let todayApptsQuery = supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .not('status', 'in', '("cancelled","no_show")')
    let weekApptsQuery = supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', weekStart)
      .lte('scheduled_at', weekEnd)
      .not('status', 'in', '("cancelled","no_show")')
    if (userId) {
      todayApptsQuery = todayApptsQuery.eq('professional_id', userId)
      weekApptsQuery = weekApptsQuery.eq('professional_id', userId)
    }

    // Financial: only this professional's transactions
    let incomeQuery = supabase
      .from('financial_transactions')
      .select('amount, split_amount')
      .eq('type', 'income')
      .eq('status', 'paid')
      .gte('paid_at', monthStart)
      .lte('paid_at', monthEnd)
    let expenseQuery = supabase
      .from('financial_transactions')
      .select('amount, split_amount')
      .eq('type', 'expense')
      .eq('status', 'paid')
      .gte('paid_at', monthStart)
      .lte('paid_at', monthEnd)
    let pendingQuery = supabase
      .from('financial_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    let overdueQuery = supabase
      .from('financial_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'overdue')
    if (userId) {
      const condition = `shared_with_id.eq.${userId},and(shared_with_id.is.null,created_by.eq.${userId})`
      incomeQuery = incomeQuery.or(condition)
      expenseQuery = expenseQuery.or(condition)
      pendingQuery = pendingQuery.or(condition)
      overdueQuery = overdueQuery.or(condition)
    }

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
      patientsQuery,
      activePatientsQuery,
      todayApptsQuery,
      weekApptsQuery,
      incomeQuery,
      expenseQuery,
      pendingQuery,
      overdueQuery,
    ])

    const monthlyRevenue = (incomeRes.data ?? []).reduce(
      (sum, t) => sum + Number(userId && t.split_amount !== null ? t.split_amount : t.amount),
      0
    )
    const monthlyExpenses = (expenseRes.data ?? []).reduce(
      (sum, t) => sum + Number(userId && t.split_amount !== null ? t.split_amount : t.amount),
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

  async getTodayAppointments(userId?: string) {
    const now = new Date()
    let query = supabase
      .from('appointments')
      .select('*, patient:patients(full_name, phone), procedure:procedures(name)')
      .gte('scheduled_at', startOfDay(now).toISOString())
      .lte('scheduled_at', endOfDay(now).toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .order('scheduled_at')
      .limit(10)
    if (userId) {
      query = query.eq('professional_id', userId)
    }
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async getRecentPatients(userId?: string) {
    let query = supabase
      .from('patients')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    if (userId) {
      query = query.or(`primary_dentist_id.eq.${userId},primary_dentist_id.is.null`)
    }
    const { data, error } = await query
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

  async getAppointmentTrend(userId?: string) {
    let query = supabase
      .from('appointments')
      .select('scheduled_at')
      .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'completed')
    if (userId) {
      query = query.eq('professional_id', userId)
    }
    const { data, error } = await query
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
