import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { appointmentSchema, type AppointmentFormData } from '@/features/appointments/schemas/appointment.schema'
import { usePatients } from '@/features/patients/hooks/usePatients'
import { useProcedures } from '@/features/procedures/hooks/useProcedures'
import { useMaterials } from '@/features/materials/hooks/useMaterials'
import { useAuth } from '@/contexts/AuthContext'
import { APPOINTMENT_STATUS_LABELS } from '@/types/enums'
import type { Appointment } from '@/types/database.types'

// Component to select material and quantity
function MaterialQuantitySelector({
  materialName,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange,
}: {
  materialName: string
  isSelected: boolean
  quantity: number
  onToggle: (selected: boolean) => void
  onQuantityChange: (qty: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <label className="flex items-center gap-2 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <span className="truncate">{materialName}</span>
      </label>
      {isSelected && (
        <div className="flex items-center gap-1 w-24">
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            className="h-8 text-xs px-2"
          />
          <span className="text-xs text-muted-foreground">un.</span>
        </div>
      )}
    </div>
  )
}

interface AppointmentFormProps {
  appointment?: Appointment
  defaultDate?: Date
  onSubmit: (data: AppointmentFormData) => void
  onDelete?: () => void
  isLoading?: boolean
}

export function AppointmentForm({
  appointment,
  defaultDate,
  onSubmit,
  onDelete,
  isLoading,
}: AppointmentFormProps) {
  const { profile } = useAuth()
  const { data: patientsData } = usePatients(1, 100)
  const { data: procedures = [] } = useProcedures(true)
  const { data: materials = [] } = useMaterials(true)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id ?? '',
      professional_id: appointment?.professional_id ?? profile?.id ?? '',
      procedure_id: appointment?.procedure_id ?? null,
      scheduled_at: appointment?.scheduled_at
        ? format(new Date(appointment.scheduled_at), "yyyy-MM-dd'T'HH:mm")
        : defaultDate
          ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
          : '',
      duration_minutes: appointment?.duration_minutes ?? 60,
      status: appointment?.status ?? 'pending',
      notes: appointment?.notes ?? '',
      internal_notes: appointment?.internal_notes ?? '',
      cancellation_reason: appointment?.cancellation_reason ?? '',
      // Extraindo do appointment.materials (no select incluímos materials:appointment_materials(material_id, quantity))
      materials: (appointment as any)?.materials?.map((m: any) => ({
        material_id: m.material_id,
        quantity: m.quantity || 1,
      })) ?? [],
    },
  })

  const status = form.watch('status')
  const selectedMaterials = form.watch('materials') ?? []

  const [materialSearch, setMaterialSearch] = useState('')
  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(materialSearch.toLowerCase()))

  const handleToggleMaterial = (materialId: string, selected: boolean) => {
    const current = form.getValues('materials') ?? []
    if (selected) {
      form.setValue('materials', [...current, { material_id: materialId, quantity: 1 }])
    } else {
      form.setValue(
        'materials',
        current.filter((m) => m.material_id !== materialId)
      )
    }
  }

  const handleQuantityChange = (materialId: string, quantity: number) => {
    const current = form.getValues('materials') ?? []
    form.setValue(
      'materials',
      current.map((m) => (m.material_id === materialId ? { ...m, quantity } : m))
    )
  }

  useEffect(() => {
    if (profile?.id && !appointment) {
      form.setValue('professional_id', profile.id)
    }
  }, [profile?.id, appointment, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patientsData?.data.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="procedure_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedimento</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                value={field.value ?? 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {procedures.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduled_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e hora *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (min)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {status === 'completed' && (
          <div>
            <FormLabel className="mb-2 block text-sm font-medium">Materiais utilizados no atendimento</FormLabel>
            <Input 
              placeholder="Buscar material..."
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              className="mb-2 h-8 text-sm"
            />
            <div className="max-h-[250px] overflow-y-auto rounded-md border p-3 bg-muted/50">
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredMaterials.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2">Nenhum material encontrado.</p>
                ) : (
                  filteredMaterials.map((mat) => {
                    const selectedMat = selectedMaterials.find(m => m.material_id === mat.id)
                    const isSelected = !!selectedMat
                    const quantity = selectedMat?.quantity || 1
  
                    return (
                      <MaterialQuantitySelector
                        key={mat.id}
                        materialName={mat.name}
                        isSelected={isSelected}
                        quantity={quantity}
                        onToggle={(selected) => handleToggleMaterial(mat.id, selected)}
                        onQuantityChange={(qty) => handleQuantityChange(mat.id, qty)}
                      />
                    )
                  })
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selecione os materiais gastos para abater do lucro ou manter o controle.
            </p>
          </div>
        )}
        {status === 'cancelled' && (
          <FormField
            control={form.control}
            name="cancellation_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo do cancelamento *</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between pt-2">
          {appointment && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              Excluir
            </Button>
          ) : (
            <div></div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : appointment ? 'Atualizar' : 'Agendar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}