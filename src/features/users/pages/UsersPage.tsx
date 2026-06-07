import { useState } from 'react'
import { Pencil } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { RoleGuard } from '@/routes/RoleGuard'
import { useUsers, useRoles, useUserMutations } from '@/features/users/hooks/useUsers'
import type { Profile } from '@/types/database.types'

export function UsersPage() {
  const { data: users = [], isLoading } = useUsers()
  const { data: roles = [] } = useRoles()
  const { update } = useUserMutations()
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', role_id: '', is_active: true })

  const openEdit = (user: Profile) => {
    setEditing(user)
    setForm({
      full_name: user.full_name,
      phone: user.phone ?? '',
      role_id: user.role_id,
      is_active: user.is_active,
    })
  }

  const handleSave = async () => {
    if (!editing) return
    try {
      await update.mutateAsync({ id: editing.id, data: form })
      toast.success('Usuário atualizado!')
      setEditing(null)
    } catch {
      toast.error('Erro ao atualizar usuário')
    }
  }

  const columns = [
    { id: 'full_name', header: 'Nome', accessorKey: 'full_name' as const },
    { id: 'email', header: 'E-mail', accessorKey: 'email' as const },
    {
      id: 'role',
      header: 'Perfil',
      cell: (row: Profile) => row.role?.display_name ?? row.role?.name ?? '—',
    },
    {
      id: 'is_active',
      header: 'Status',
      cell: (row: Profile) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (row: Profile) => (
        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <RoleGuard adminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Usuários"
          description="Gerencie usuários e permissões da clínica"
        />

        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground">Carregando...</p>
        ) : (
          <DataTable columns={columns} data={users} />
        )}

        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Perfil</Label>
                <Select
                  value={form.role_id}
                  onValueChange={(v) => setForm({ ...form, role_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Usuário ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={update.isPending}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
