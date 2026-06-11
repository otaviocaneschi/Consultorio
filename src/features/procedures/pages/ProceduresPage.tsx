import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ProcedureForm } from '@/features/procedures/components/ProcedureForm'
import { useProcedures, useProcedureMutations } from '@/features/procedures/hooks/useProcedures'
import { formatCurrency } from '@/utils/formatters'
import { PROCEDURE_CATEGORY_LABELS } from '@/types/enums'
import type { Procedure } from '@/types/database.types'
import type { ProcedureFormData } from '@/features/procedures/schemas/procedure.schema'

export function ProceduresPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Procedure | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: procedures = [], isLoading } = useProcedures()
  const { create, update, remove } = useProcedureMutations()

  const handleSubmit = async (formData: ProcedureFormData) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: formData })
        toast.success('Procedimento atualizado!')
      } else {
        await create.mutateAsync(formData)
        toast.success('Procedimento cadastrado!')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch {
      toast.error('Erro ao salvar procedimento')
    }
  }

  const columns = [
    { id: 'name', header: 'Nome', accessorKey: 'name' as const, sortable: true },
    {
      id: 'category',
      header: 'Categoria',
      cell: (row: Procedure) => PROCEDURE_CATEGORY_LABELS[row.category],
    },
    {
      id: 'duration_minutes',
      header: 'Duração',
      cell: (row: Procedure) => `${row.duration_minutes} min`,
    },
    {
      id: 'base_price',
      header: 'Valor',
      cell: (row: Procedure) => formatCurrency(row.base_price),
    },
    {
      id: 'is_active',
      header: 'Status',
      cell: (row: Procedure) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (row: Procedure) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(row)
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
        title="Procedimentos"
        description="Gerencie seus procedimentos e serviços"

      >
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo procedimento
        </Button>
      </PageHeader>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={procedures} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar procedimento' : 'Novo procedimento'}
            </DialogTitle>
          </DialogHeader>
          <ProcedureForm
            procedure={editing ?? undefined}
            onSubmit={handleSubmit}
            isLoading={create.isPending || update.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir procedimento"
        description="Tem certeza que deseja excluir este procedimento?"
        onConfirm={async () => {
          if (!deleteId) return
          try {
            await remove.mutateAsync(deleteId)
            toast.success('Procedimento excluído!')
            setDeleteId(null)
          } catch {
            toast.error('Erro ao excluir')
          }
        }}
        variant="destructive"
      />
    </div>
  )
}
