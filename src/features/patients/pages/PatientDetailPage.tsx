import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Calendar, DollarSign } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatient, usePatientMutations } from '@/features/patients/hooks/usePatients'
import { usePatientAppointments } from '@/features/appointments/hooks/useAppointments'
import { formatDate, formatPhone, getInitials, getWhatsAppLink, calculateAge } from '@/utils/formatters'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GENDER_LABELS, APPOINTMENT_STATUS_LABELS } from '@/types/enums'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading } = usePatient(id || '')
  const { data: appointments = [] } = usePatientAppointments(id || '')
  const mutations = usePatientMutations()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!patient) {
    return <p className="text-muted-foreground">Paciente não encontrado.</p>
  }

  const whatsappPhone = patient.phone_secondary || patient.phone

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/pacientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={patient.photo_url ?? undefined} />
            <AvatarFallback className="text-lg">{getInitials(patient.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Cadastro: {formatDate(patient.created_at)}</span>
              <Badge variant={patient.is_active ? 'default' : 'secondary'}>
                {patient.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          {whatsappPhone && (
            <Button variant="outline" asChild className="ml-auto">
              <a
                href={getWhatsAppLink(whatsappPhone, `Olá ${patient.full_name}!`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="prontuario" asChild>
            <Link to={`/pacientes/${id}/prontuario`}>
              <FileText className="mr-2 h-4 w-4" />
              Prontuário
            </Link>
          </TabsTrigger>
          <TabsTrigger value="agendamentos">
            <Calendar className="mr-2 h-4 w-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="financeiro">
            <DollarSign className="mr-2 h-4 w-4" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF</span>
                  <span>{patient.cpf || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RG</span>
                  <span>{patient.rg || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nascimento</span>
                  <span>
                    {formatDate(patient.birth_date)}
                    {patient.birth_date && ` (${calculateAge(patient.birth_date)} anos)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sexo</span>
                  <span>{patient.gender ? GENDER_LABELS[patient.gender] : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última consulta</span>
                  <span>{formatDate(patient.last_appointment_at)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone</span>
                  <span>{formatPhone(patient.phone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span>{patient.phone_secondary ? formatPhone(patient.phone_secondary) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-mail</span>
                  <span>{patient.email || '—'}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  {[patient.address_street, patient.address_number, patient.address_complement]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </p>
                <p className="text-muted-foreground">
                  {[patient.address_neighborhood, patient.address_city, patient.address_state]
                    .filter(Boolean)
                    .join(' - ')}
                </p>
                <p className="text-muted-foreground">CEP: {patient.address_zip || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saúde</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convênio</span>
                  <span>{patient.health_insurance || 'Particular'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peso</span>
                  <span>{patient.weight ? `${patient.weight} kg` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Altura</span>
                  <span>{patient.height ? `${patient.height}` : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Alergias: </span>
                  <span>{patient.allergies || 'Nenhuma registrada'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Observações: </span>
                  <span>{patient.medical_notes || '—'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agendamentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum agendamento encontrado para este paciente.
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="rounded-lg border p-4 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-2 mb-2 gap-2">
                        <div>
                          <p className="font-medium text-lg text-primary">
                            {format(parseISO(apt.scheduled_at), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Procedimento: <span className="font-medium text-foreground">{apt.procedure?.name || 'Não informado'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                            {APPOINTMENT_STATUS_LABELS[apt.status]}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">Duração: {apt.duration_minutes} min</p>
                        </div>
                      </div>
                      
                      {/* Materiais Usados */}
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Materiais Utilizados:</p>
                        {(apt as any).materials && (apt as any).materials.length > 0 ? (
                          <ul className="text-sm space-y-1 bg-muted/50 p-3 rounded-md">
                            {(apt as any).materials.map((m: any, index: number) => (
                              <li key={index} className="flex justify-between border-b last:border-0 pb-1 last:pb-0">
                                <span>{m.material?.name || 'Material desconhecido'}</span>
                                <span className="font-medium text-muted-foreground">{m.quantity} un.</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Nenhum material registrado neste atendimento.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Transações financeiras disponíveis no módulo Financeiro.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
