import { supabase } from '@/lib/supabase/client'
import type { PaginationParams, PaginatedResult } from '@/types/common.types'
import type { Patient } from '@/types/database.types'
import type { PatientFormData } from '@/features/patients/schemas/patient.schema'

export interface PatientFilters {
  isActive?: boolean
  healthInsurance?: string
  primaryDentistId?: string | 'shared'
}

export const patientRepository = {
  async findAll(
    params: PaginationParams,
    filters?: PatientFilters
  ): Promise<PaginatedResult<Patient>> {
    const { page, pageSize, search, sortBy = 'full_name', sortOrder = 'asc' } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('patients')
      .select('*, primary_dentist:profiles!primary_dentist_id(id, full_name)', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.healthInsurance) {
      query = query.ilike('health_insurance', `%${filters.healthInsurance}%`)
    }
    if (filters?.primaryDentistId) {
      if (filters.primaryDentistId === 'shared') {
        query = query.is('primary_dentist_id', null)
      } else {
        query = query.eq('primary_dentist_id', filters.primaryDentistId)
      }
    }

    const { data, error, count } = await query
    if (error) throw error

    const total = count ?? 0
    return {
      data: (data ?? []) as Patient[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  },

  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*, primary_dentist:profiles!primary_dentist_id(id, full_name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Patient
  },

  async create(patient: PatientFormData, userId?: string): Promise<Patient> {
    const cleanData = Object.fromEntries(
      Object.entries(patient).map(([k, v]) => [k, v === '' ? null : v])
    )
    const { data, error } = await supabase
      .from('patients')
      .insert({ ...cleanData, created_by: userId })
      .select()
      .single()
    if (error) throw error
    return data as Patient
  },

  async update(id: string, patient: Partial<PatientFormData>): Promise<Patient> {
    const cleanData = Object.fromEntries(
      Object.entries(patient).map(([k, v]) => [k, v === '' ? null : v])
    )
    const { data, error } = await supabase
      .from('patients')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Patient
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) throw error
  },

  async updatePhoto(id: string, photoUrl: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update({ photo_url: photoUrl })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Patient
  },
}

