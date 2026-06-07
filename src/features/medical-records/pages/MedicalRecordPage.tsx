import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUpload } from '@/components/shared/FileUpload'
import { RecordTimeline } from '@/features/medical-records/components/RecordTimeline'
import { RecordForm } from '@/features/medical-records/components/RecordForm'
import {
  useMedicalRecords,
  useMedicalRecordMutations,
} from '@/features/medical-records/hooks/useMedicalRecords'
import { usePatient } from '@/features/patients/hooks/usePatients'
import type { MedicalRecordFormData } from '@/features/medical-records/schemas/medical-record.schema'

export function MedicalRecordPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient, isLoading: patientLoading } = usePatient(patientId)
  const { data: records = [], isLoading: recordsLoading } = useMedicalRecords(patientId)
  const { create, uploadAttachment } = useMedicalRecordMutations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lastRecordId, setLastRecordId] = useState<string | null>(null)

  const handleSubmit = async (data: MedicalRecordFormData) => {
    try {
      const { procedure_ids, ...recordData } = data
      const record = await create.mutateAsync({
        data: recordData,
        procedureIds: procedure_ids,
      })
      setLastRecordId(record.id)
      toast.success('Registro salvo no prontuário!')
      setDialogOpen(false)
    } catch {
      toast.error('Erro ao salvar registro')
    }
  }

  const handleUpload = async (files: File[]) => {
    if (!lastRecordId || !patientId) {
      toast.error('Salve um registro antes de anexar arquivos')
      return
    }
    try {
      for (const file of files) {
        await uploadAttachment.mutateAsync({
          recordId: lastRecordId,
          file,
          patientId,
        })
      }
      toast.success('Anexos enviados!')
    } catch {
      toast.error('Erro ao enviar anexos')
    }
  }

  if (patientLoading || recordsLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/pacientes/${patientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Prontuário</h1>
          <p className="text-muted-foreground">{patient?.full_name}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo registro
        </Button>
      </div>

      <RecordTimeline records={records} />

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-medium">Anexar arquivos ao último registro</h3>
        <FileUpload onChange={handleUpload} accept={{ 'image/*': [], 'application/pdf': [] }} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo registro clínico</DialogTitle>
          </DialogHeader>
          {patientId && (
            <RecordForm
              patientId={patientId}
              onSubmit={handleSubmit}
              isLoading={create.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
