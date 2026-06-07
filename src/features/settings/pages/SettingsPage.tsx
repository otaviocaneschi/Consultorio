import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { FileUpload } from '@/components/shared/FileUpload'
import { settingsService } from '@/features/settings/services/settings.service'
import { ProceduresPage } from '@/features/procedures/pages/ProceduresPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { Skeleton } from '@/components/ui/skeleton'

const DAYS = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: () => settingsService.getClinicSettings(),
  })

  const [form, setForm] = useState({
    clinic_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    cnpj: '',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        clinic_name: settings.clinic_name,
        phone: settings.phone ?? '',
        whatsapp: settings.whatsapp ?? '',
        email: settings.email ?? '',
        address_street: settings.address_street ?? '',
        address_city: settings.address_city,
        address_state: settings.address_state,
        address_zip: settings.address_zip ?? '',
        cnpj: settings.cnpj ?? '',
      })
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: () => settingsService.updateClinicSettings(settings!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
      toast.success('Configurações salvas!')
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  })

  const uploadLogo = useMutation({
    mutationFn: async (files: File[]) => {
      const url = await settingsService.uploadLogo(files[0])
      await settingsService.updateClinicSettings(settings!.id, { logo_url: url })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
      toast.success('Logo atualizado!')
    },
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Dados e preferências da clínica" />

      <Tabs defaultValue="clinic">
        <TabsList>
          <TabsTrigger value="clinic">Clínica</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da clínica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Nome da clínica</Label>
                <Input
                  value={form.clinic_name}
                  onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={form.address_street}
                  onChange={(e) => setForm({ ...form, address_street: e.target.value })}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={form.address_city}
                  onChange={(e) => setForm({ ...form, address_city: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={form.address_state}
                  onChange={(e) => setForm({ ...form, address_state: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  Salvar alterações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo da clínica</CardTitle>
            </CardHeader>
            <CardContent>
              {settings?.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="mb-4 h-16 object-contain"
                />
              )}
              <FileUpload
                onChange={(files) => uploadLogo.mutate(files)}
                accept={{ 'image/*': [] }}
                maxFiles={1}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Horário de funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const hours = settings?.working_hours?.[key]
                return (
                  <div key={key} className="flex items-center gap-4 text-sm">
                    <span className="w-24 font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {hours?.enabled
                        ? `${hours.open} — ${hours.close}`
                        : 'Fechado'}
                    </span>
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground">
                Edição detalhada de horários disponível via painel administrativo do banco.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures">
          <ProceduresPage />
        </TabsContent>

        <TabsContent value="users">
          <UsersPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
