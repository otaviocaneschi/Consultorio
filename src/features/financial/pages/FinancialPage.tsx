import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TransactionForm } from '@/features/financial/components/TransactionForm'
import {
  useFinancialTransactions,
  useFinancialSummary,
  useFinancialMutations,
} from '@/features/financial/hooks/useFinancial'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/types/enums'
import type { FinancialTransaction } from '@/types/database.types'
import type { FinancialFormData } from '@/features/financial/schemas/financial.schema'

export function FinancialPage() {
  const [tab, setTab] = useState('dashboard')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialTransaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('income')

  const { data: transactions = [] } = useFinancialTransactions()
  const { data: summary } = useFinancialSummary()
  const { create, update, remove } = useFinancialMutations()

  const incomes = transactions.filter((t) => t.type === 'income')
  const expenses = transactions.filter((t) => t.type === 'expense')

  const chartData = [
    { name: 'Receitas', valor: summary?.totalIncome ?? 0 },
    { name: 'Despesas', valor: summary?.totalExpense ?? 0 },
  ]

  const handleSubmit = async (formData: FinancialFormData) => {
    try {
      const payload = {
        ...formData,
        paid_at: formData.status === 'paid' ? new Date().toISOString() : null,
      }
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload })
        toast.success('Transação atualizada!')
      } else {
        await create.mutateAsync(payload)
        toast.success('Transação registrada!')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch {
      toast.error('Erro ao salvar transação')
    }
  }

  const makeColumns = (type: 'income' | 'expense') => [
    { id: 'description', header: 'Descrição', accessorKey: 'description' as const },
    {
      id: 'amount',
      header: 'Valor',
      cell: (row: FinancialTransaction) => formatCurrency(row.split_amount !== null ? row.split_amount : row.amount),
    },
    {
      id: 'due_date',
      header: 'Vencimento',
      cell: (row: FinancialTransaction) => formatDate(row.due_date),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row: FinancialTransaction) => (
        <Badge variant={row.status === 'overdue' ? 'destructive' : 'secondary'}>
          {TRANSACTION_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (row: FinancialTransaction) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(row)
              setDefaultType(type)
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

  const openNew = (type: 'income' | 'expense') => {
    setEditing(null)
    setDefaultType(type)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Controle de receitas e despesas da clínica" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Receitas" value={formatCurrency(summary?.totalIncome ?? 0)} />
            <StatCard title="Despesas" value={formatCurrency(summary?.totalExpense ?? 0)} />
            <StatCard
              title="Saldo"
              value={formatCurrency((summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0))}
            />
            <StatCard title="Pendentes" value={String(summary?.pending ?? 0)} />
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-4 font-medium">Receitas vs Despesas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="valor" fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNew('income')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova receita
            </Button>
          </div>
          <DataTable columns={makeColumns('income')} data={incomes} />
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNew('expense')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova despesa
            </Button>
          </div>
          <DataTable columns={makeColumns('expense')} data={expenses} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? 'Editar transação'
                : `Nova ${TRANSACTION_TYPE_LABELS[defaultType].toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={editing ?? undefined}
            defaultType={defaultType}
            onSubmit={handleSubmit}
            isLoading={create.isPending || update.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir transação"
        description="Tem certeza que deseja excluir esta transação?"
        onConfirm={async () => {
          if (!deleteId) return
          try {
            await remove.mutateAsync(deleteId)
            toast.success('Transação excluída!')
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
