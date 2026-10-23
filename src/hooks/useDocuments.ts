import { useQuery } from '@tanstack/react-query'
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
