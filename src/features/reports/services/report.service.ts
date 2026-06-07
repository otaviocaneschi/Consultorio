import { supabase } from '@/lib/supabase/client'
import { exportToPDF, exportToExcel, type ExportColumn } from '@/utils/export'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import { APPOINTMENT_STATUS_LABELS, PROCEDURE_CATEGORY_LABELS, TRANSACTION_STATUS_LABELS } from '@/types/enums'
import type { AppointmentStatus, ProcedureCategory, TransactionStatus } from '@/types/enums'

export type ReportType = 'patients' | 'appointments' | 'procedures' | 'financial'

export const reportService = {
  async fetchData(type: ReportType, startDate?: string, endDate?: string) {
    switch (type) {
      case 'patients': {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .order('full_name')
        if (error) throw error
        return (data ?? []).map((p) => ({
          full_name: p.full_name,
          cpf: p.cpf ?? '',
          phone: p.phone,
          email: p.email ?? '',
          health_insurance: p.health_insurance ?? 'Particular',
          created_at: formatDate(p.created_at),
          is_active: p.is_active ? 'Ativo' : 'Inativo',
        }))
      }
      case 'appointments': {
        let query = supabase
          .from('appointments')
          .select('*, patient:patients(full_name), procedure:procedures(name)')
          .order('scheduled_at', { ascending: false })
        if (startDate) query = query.gte('scheduled_at', startDate)
        if (endDate) query = query.lte('scheduled_at', endDate)
        const { data, error } = await query
        if (error) throw error
        return (data ?? []).map((a) => ({
          patient: a.patient?.full_name ?? '',
          procedure: a.procedure?.name ?? '',
          scheduled_at: formatDateTime(a.scheduled_at),
          status: APPOINTMENT_STATUS_LABELS[a.status as AppointmentStatus],
          notes: a.notes ?? '',
        }))
      }
      case 'procedures': {
        const { data, error } = await supabase.from('procedures').select('*').order('name')
        if (error) throw error
        return (data ?? []).map((p) => ({
          name: p.name,
          category: PROCEDURE_CATEGORY_LABELS[p.category as ProcedureCategory],
          duration_minutes: `${p.duration_minutes} min`,
          base_price: formatCurrency(p.base_price),
          is_active: p.is_active ? 'Ativo' : 'Inativo',
        }))
      }
      case 'financial': {
        let query = supabase
          .from('financial_transactions')
          .select('*, patient:patients(full_name)')
          .order('created_at', { ascending: false })
        if (startDate) query = query.gte('due_date', startDate)
        if (endDate) query = query.lte('due_date', endDate)
        const { data, error } = await query
        if (error) throw error
        return (data ?? []).map((t) => ({
          description: t.description,
          type: t.type === 'income' ? 'Receita' : 'Despesa',
          amount: formatCurrency(t.amount),
          status: TRANSACTION_STATUS_LABELS[t.status as TransactionStatus],
          due_date: formatDate(t.due_date),
          patient: t.patient?.full_name ?? '',
        }))
      }
    }
  },

  getColumns(type: ReportType): ExportColumn[] {
    const columns: Record<ReportType, ExportColumn[]> = {
      patients: [
        { header: 'Nome', key: 'full_name' },
        { header: 'CPF', key: 'cpf' },
        { header: 'Telefone', key: 'phone' },
        { header: 'E-mail', key: 'email' },
        { header: 'Convênio', key: 'health_insurance' },
        { header: 'Cadastro', key: 'created_at' },
        { header: 'Status', key: 'is_active' },
      ],
      appointments: [
        { header: 'Paciente', key: 'patient' },
        { header: 'Procedimento', key: 'procedure' },
        { header: 'Data/Hora', key: 'scheduled_at' },
        { header: 'Status', key: 'status' },
        { header: 'Observações', key: 'notes' },
      ],
      procedures: [
        { header: 'Nome', key: 'name' },
        { header: 'Categoria', key: 'category' },
        { header: 'Duração', key: 'duration_minutes' },
        { header: 'Valor', key: 'base_price' },
        { header: 'Status', key: 'is_active' },
      ],
      financial: [
        { header: 'Descrição', key: 'description' },
        { header: 'Tipo', key: 'type' },
        { header: 'Valor', key: 'amount' },
        { header: 'Status', key: 'status' },
        { header: 'Vencimento', key: 'due_date' },
        { header: 'Paciente', key: 'patient' },
      ],
    }
    return columns[type]
  },

  async exportPDF(type: ReportType, startDate?: string, endDate?: string) {
    const data = await this.fetchData(type, startDate, endDate)
    const columns = this.getColumns(type)
    const titles: Record<ReportType, string> = {
      patients: 'Relatório de Pacientes',
      appointments: 'Relatório de Atendimentos',
      procedures: 'Relatório de Procedimentos',
      financial: 'Relatório Financeiro',
    }
    exportToPDF(titles[type], columns, data, `relatorio-${type}-${Date.now()}`)
  },

  async exportExcel(type: ReportType, startDate?: string, endDate?: string) {
    const data = await this.fetchData(type, startDate, endDate)
    const columns = this.getColumns(type)
    exportToExcel('Relatório', columns, data, `relatorio-${type}-${Date.now()}`)
  },
}
