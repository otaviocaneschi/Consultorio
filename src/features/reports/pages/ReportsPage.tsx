import { useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import {
  reportService,
  type ReportType,
} from '@/features/reports/services/report.service'
import { useQuery } from '@tanstack/react-query'

const REPORT_LABELS: Record<ReportType, string> = {
  patients: 'Pacientes',
  appointments: 'Atendimentos',
  procedures: 'Procedimentos',
  financial: 'Financeiro',
}

export function ReportsPage() {
  const [type, setType] = useState<ReportType>('patients')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data = [], isLoading, refetch } = useQuery<Record<string, unknown>[]>({
    queryKey: ['reports', type, startDate, endDate],
    queryFn: () => reportService.fetchData(type, startDate || undefined, endDate || undefined),
  })

  const columns = reportService.getColumns(type).map((col) => ({
    id: col.key,
    header: col.header,
    accessorKey: col.key,
  }))

  const handleExportPDF = async () => {
    try {
      await reportService.exportPDF(type, startDate || undefined, endDate || undefined)
      toast.success('PDF exportado!')
    } catch {
      toast.error('Erro ao exportar PDF')
    }
  }

  const handleExportExcel = async () => {
    try {
      await reportService.exportExcel(type, startDate || undefined, endDate || undefined)
      toast.success('Excel exportado!')
    } catch {
      toast.error('Erro ao exportar Excel')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Gere e exporte relatórios da clínica"
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo</label>
          <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Data início</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Data fim</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Atualizar
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileDown className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Button variant="outline" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          emptyMessage="Nenhum dado encontrado para o período selecionado."
        />
      )}
    </div>
  )
}
