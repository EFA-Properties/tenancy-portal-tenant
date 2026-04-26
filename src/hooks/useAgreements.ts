import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface TenancyAgreement {
  id: string
  tenancy_id: string
  type: 'tenancy_agreement' | 'inventory'
  title: string
  content: string
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'countersigned'
  landlord_signed_at?: string
  landlord_signature_data?: string
  landlord_signature_type?: 'drawn' | 'typed'
  tenant_signed_at?: string
  tenant_signature_data?: string
  tenant_signature_type?: 'drawn' | 'typed'
  tenant_ip?: string
  tenant_user_agent?: string
  pdf_storage_path?: string
  sent_at?: string
  created_at: string
  updated_at: string
}

/**
 * Fetch all agreements for a tenancy (tenant perspective)
 * Only returns sent/viewed/signed/countersigned — not drafts
 */
export function useAgreements(tenancyId?: string) {
  return useQuery({
    queryKey: ['agreements', tenancyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .select('*')
        .eq('tenancy_id', tenancyId!)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TenancyAgreement[]
    },
    enabled: !!tenancyId,
  })
}

export function useAgreement(id?: string) {
  return useQuery({
    queryKey: ['agreement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as TenancyAgreement
    },
    enabled: !!id,
  })
}

/**
 * Mark agreement as viewed by tenant
 */
export function useMarkViewed() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (agreementId: string) => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .update({
          status: 'viewed',
        })
        .eq('id', agreementId)
        .eq('status', 'sent') // Only update if currently 'sent'
        .select()
        .single()

      if (error) throw error
      return data as TenancyAgreement
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agreement', data.id] })
      qc.invalidateQueries({ queryKey: ['agreements', data.tenancy_id] })
    },
  })
}

/**
 * Sign the agreement as tenant
 */
export function useSignAgreementAsTenant() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      agreementId: string
      signatureData: string
      signatureType: 'drawn' | 'typed'
    }) => {
      const { data, error } = await supabase
        .from('tenancy_agreements')
        .update({
          tenant_signed_at: new Date().toISOString(),
          tenant_signature_data: params.signatureData,
          tenant_signature_type: params.signatureType,
          tenant_user_agent: navigator.userAgent,
          status: 'countersigned',
        })
        .eq('id', params.agreementId)
        .select()
        .single()

      if (error) throw error
      return data as TenancyAgreement
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agreement', data.id] })
      qc.invalidateQueries({ queryKey: ['agreements', data.tenancy_id] })
    },
  })
}
