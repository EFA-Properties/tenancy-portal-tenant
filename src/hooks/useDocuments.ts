import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Document } from '../types/database'

export function useDocuments(tenancyId: string | undefined, propertyId?: string) {
  return useQuery({
    queryKey: ['documents', tenancyId, propertyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')

      // Documents for this tenancy plus the property-wide ones (gas safety, EPC, etc.)
      const scopeFilter = propertyId
        ? `tenancy_id.eq.${tenancyId},property_id.eq.${propertyId}`
        : `tenancy_id.eq.${tenancyId}`

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(scopeFilter)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return (data || []).filter((d: any) => d.tenant_visible !== false) as Document[]
    },
    enabled: !!tenancyId,
  })
}

export function useDocument(documentId: string | undefined) {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error('No document ID')

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error
      return data as Document
    },
    enabled: !!documentId,
  })
}

// Documents this tenant has already confirmed receiving
export function useMyAcknowledgements() {
  return useQuery({
    queryKey: ['document_acknowledgements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_acknowledgements')
        .select('document_id, confirmed_at, receipt_file_path')
        .not('confirmed_at', 'is', null)

      if (error) throw error
      return (data || []) as { document_id: string; confirmed_at: string; receipt_file_path: string | null }[]
    },
  })
}

// Records that the tenant opened, or confirmed receipt of, a document
export function useRecordDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ documentId, action }: { documentId: string; action: 'opened' | 'confirmed' }) => {
      if (action === 'confirmed') {
        // The server records the confirmation and makes the stamped, signed copy
        const { data, error } = await supabase.functions.invoke('confirm-document', {
          body: { document_id: documentId },
        })
        if (error) throw error
        if (!data?.ok) throw new Error(data?.error || 'Could not record this document')
        return data
      }
      const { data, error } = await supabase.rpc('tenant_record_document', {
        p_document_id: documentId,
        p_action: action,
        p_user_agent: navigator.userAgent,
      })
      if (error) throw error
      if (!data) throw new Error('Could not record this document')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document_acknowledgements'] })
    },
  })
}
