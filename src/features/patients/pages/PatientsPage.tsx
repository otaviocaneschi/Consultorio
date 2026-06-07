import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { usePatients, usePatientMutations } from '@/features/patients/hooks/usePatients'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { formatDate, formatPhone } from '@/utils/formatters'
import type { Patient } from '@/types/database.types'
import type { PatientFormData } from '@/features/patients/schemas/patient.schema'

export function PatientsPage() {
  const { page, pageSize, setPage, reset } = usePagination(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const debouncedSearch = useDebounce(search)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filters = {
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  }

  const { data, isLoading } = usePatients(page, pageSize, debouncedSearch, filters)
  const { create, update, remove } = usePatientMutations()

  const handleSubmit = async (formData: PatientFormData) => {
    try {
      if (editingPatient) {
        await update.mutateAsync({ id: editingPatient.id, data: formData })
        toast.success('Paciente atualizado!')
      } else {
        await create.mutateAsync(formData)
        toast.success('Paciente cadastrado!')
      }
      setDialogOpen(false)
      setEditingPatient(null)
    } catch {
      toast.error('Erro ao salvar paciente')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      toast.success('Paciente excluído!')
      setDeleteId(null)
    } catch {
      toast.error('Erro ao excluir paciente')
    }
  }

  const columns = [
    { id: 'full_name', header: 'Nome', accessorKey: 'full_name' as const, sortable: true },
    { id: 'cpf', header: 'CPF', accessorKey: 'cpf' as const },
    {
      id: 'phone',
      header: 'Telefone',
      cell: (row: Patient) => formatPhone(row.phone),
    },
    {
      id: 'last_appointment_at',
      header: 'Última consulta',
      cell: (row: Patient) => formatDate(row.last_appointment_at),
    },
    {
      id: 'is_active',
      header: 'Status',
      cell: (row: Patient) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (row: Patient) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/pacientes/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingPatient(row)
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description="Gerencie o cadastro de pacientes da clínica"

      >
        <Button
          onClick={() => {
            setEditingPatient(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo paciente
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            reset()
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            reset()
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={data?.data ?? []} pageSize={pageSize} />
      )}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Página {page} de {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? 'Editar paciente' : 'Novo paciente'}
            </DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={editingPatient ?? undefined}
            onSubmit={handleSubmit}
            isLoading={create.isPending || update.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir paciente"
        description="Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
