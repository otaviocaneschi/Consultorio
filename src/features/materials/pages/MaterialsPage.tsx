import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable'
import { formatCurrency } from '@/utils/formatters'
import { useMaterials, useMaterialMutations } from '@/features/materials/hooks/useMaterials'
import { MaterialForm } from '@/features/materials/components/MaterialForm'
import type { Material } from '@/types/database.types'
import type { MaterialFormData } from '@/features/materials/schemas/material.schema'

export function MaterialsPage() {
  const { data: materials = [], isLoading } = useMaterials()
  const { create, update, remove } = useMaterialMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const handleSubmit = async (formData: MaterialFormData) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: formData })
        toast.success('Material atualizado com sucesso!')
      } else {
        await create.mutateAsync(formData)
        toast.success('Material cadastrado com sucesso!')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar material')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este material?')) {
      try {
        await remove.mutateAsync(id)
        toast.success('Material excluído com sucesso!')
      } catch (error: any) {
        if (error?.code === '23503') {
          toast.error('Este material não pode ser excluído pois já foi utilizado em atendimentos. Tente inativá-lo editando o status.')
        } else {
          toast.error(error instanceof Error ? error.message : 'Erro ao excluir material')
        }
      }
    }
  }

  const columns: DataTableColumn<Material>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Nome do Material',
    },
    {
      id: 'cost',
      accessorKey: 'cost',
      header: 'Custo',
      cell: (row: Material) => formatCurrency(row.cost),
    },
    {
      id: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      cell: (row: Material) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}
        >
          {row.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (row: Material) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(row)
              setDialogOpen(true)
            }}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={() => handleDelete(row.id)}
            disabled={remove.isPending}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materiais e Consumíveis"
        description="Gerencie seus materiais e custos base."
      >
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo material
        </Button>
      </PageHeader>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : (
        <DataTable columns={columns} data={materials} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar material' : 'Novo material'}
            </DialogTitle>
          </DialogHeader>
          <MaterialForm
            material={editing ?? undefined}
            onSubmit={handleSubmit}
            isLoading={create.isPending || update.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
