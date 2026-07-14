import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Paperclip, ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import type { MedicalRecord, MedicalRecordAttachment } from '@/types/database.types'
import { PROCEDURE_CATEGORY_LABELS } from '@/types/enums'
import { medicalRecordRepository } from '@/features/medical-records/repositories/medical-record.repository'
import { toast } from 'sonner'

function AttachmentButton({ attachment }: { attachment: MedicalRecordAttachment }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleOpen = async () => {
    try {
      setIsLoading(true)
      const url = await medicalRecordRepository.getAttachmentUrl(attachment.file_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error opening attachment:', error)
      toast.error('Erro ao abrir o anexo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 h-8 text-xs font-normal"
      onClick={handleOpen}
      disabled={isLoading}
      title={attachment.file_name}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Paperclip className="h-3 w-3" />
      )}
      <span className="max-w-[150px] truncate">{attachment.file_name}</span>
      <ExternalLink className="h-3 w-3 opacity-50" />
    </Button>
  )
}

interface RecordTimelineProps {
  records: MedicalRecord[]
}

export function RecordTimeline({ records }: RecordTimelineProps) {
  if (!records.length) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nenhum registro no prontuário ainda.
      </p>
    )
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-0 h-full w-px bg-border" />
      {records.map((record, index) => (
        <div key={record.id} className="relative pl-10 pb-8">
          <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  {format(new Date(record.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {record.professional?.full_name}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {record.chief_complaint && (
                <div>
                  <span className="font-medium text-muted-foreground">Queixa: </span>
                  {record.chief_complaint}
                </div>
              )}
              {record.diagnosis && (
                <div>
                  <span className="font-medium text-muted-foreground">Diagnóstico: </span>
                  {record.diagnosis}
                </div>
              )}
              {record.evolution && (
                <div>
                  <span className="font-medium text-muted-foreground">Evolução: </span>
                  {record.evolution}
                </div>
              )}
              {record.treatment_plan && (
                <div>
                  <span className="font-medium text-muted-foreground">Plano: </span>
                  {record.treatment_plan}
                </div>
              )}
              {record.procedures && record.procedures.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {record.procedures.map((rp) => (
                    <Badge key={rp.id} variant="secondary">
                      {rp.procedure?.name ??
                        PROCEDURE_CATEGORY_LABELS[rp.procedure?.category ?? 'other']}
                    </Badge>
                  ))}
                </div>
              )}
              {record.attachments && record.attachments.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    {record.attachments.length} anexo{record.attachments.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {record.attachments.map((attachment) => (
                      <AttachmentButton key={attachment.id} attachment={attachment} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {index < records.length - 1 && <Separator className="mt-4 opacity-0" />}
        </div>
      ))}
    </div>
  )
}
