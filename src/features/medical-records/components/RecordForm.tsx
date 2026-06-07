import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { medicalRecordSchema, type MedicalRecordFormData } from '@/features/medical-records/schemas/medical-record.schema'
import { useProcedures } from '@/features/procedures/hooks/useProcedures'
import { useAuth } from '@/contexts/AuthContext'
import type { MedicalRecord } from '@/types/database.types'

// Simple checkbox - create inline if not exists
function CheckboxField({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-4 w-4 rounded border"
      />
      {label}
    </label>
  )
}

interface RecordFormProps {
  patientId: string
  record?: MedicalRecord
  onSubmit: (data: MedicalRecordFormData) => void
  isLoading?: boolean
}

export function RecordForm({ patientId, record, onSubmit, isLoading }: RecordFormProps) {
  const { profile } = useAuth()
  const { data: procedures = [] } = useProcedures(true)

  const form = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      patient_id: patientId,
      appointment_id: record?.appointment_id ?? null,
      professional_id: record?.professional_id ?? profile?.id ?? '',
      chief_complaint: record?.chief_complaint ?? '',
      anamnesis: record?.anamnesis ?? '',
      physical_examination: record?.physical_examination ?? '',
      diagnosis: record?.diagnosis ?? '',
      treatment_plan: record?.treatment_plan ?? '',
      evolution: record?.evolution ?? '',
      prescriptions: record?.prescriptions ?? '',
      procedure_ids: record?.procedures?.map((p) => p.procedure_id) ?? [],
      is_confidential: record?.is_confidential ?? false,
    },
  })

  const selectedProcedures = form.watch('procedure_ids') ?? []

  const toggleProcedure = (id: string) => {
    const current = form.getValues('procedure_ids') ?? []
    form.setValue(
      'procedure_ids',
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id]
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="chief_complaint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Queixas</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnóstico</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evolution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Evolução</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="treatment_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano de tratamento / Observações</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel className="mb-2 block">Procedimentos realizados</FormLabel>
          <div className="grid gap-2 sm:grid-cols-2">
            {procedures.map((proc) => (
              <CheckboxField
                key={proc.id}
                checked={selectedProcedures.includes(proc.id)}
                onCheckedChange={() => toggleProcedure(proc.id)}
                label={proc.name}
              />
            ))}
          </div>
        </div>
        <FormField
          control={form.control}
          name="is_confidential"
          render={({ field }) => (
            <FormItem>
              <CheckboxField
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Registro confidencial"
              />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : record ? 'Atualizar registro' : 'Salvar registro'}
        </Button>
      </form>
    </Form>
  )
}
