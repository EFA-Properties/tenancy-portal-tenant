import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface LandlordInfo {
  full_name: string
  email: string
  phone?: string
}

/**
 * Fetch the landlord's contact info for a given property.
 * Uses: properties.landlord_id → landlords (full_name, email, phone)
 */
export function useLandlordInfo(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['landlord-info', propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error('No property ID')

      const { data, error } = await supabase
        .from('properties')
        .select('landlords(full_name, email, phone)')
        .eq('id', propertyId)
        .single()

      if (error) throw error

      const landlord = (data as any)?.landlords
      if (!landlord) return null

      return landlord as LandlordInfo
    },
    enabled: !!propertyId,
  })
}
