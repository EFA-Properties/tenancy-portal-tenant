import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tenancy } from '../types/database'

export function useTenancies() {
  return useQuery({
    queryKey: ['tenancies'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Find the tenant record for this auth user
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!tenant) return [] as Tenancy[]

      // Get tenancies via the junction table
      const { data: links, error: linkError } = await supabase
        .from('tenancy_tenants')
        .select('tenancy_id')
        .eq('tenant_id', tenant.id)

      if (linkError) throw linkError
      if (!links || links.length === 0) return [] as Tenancy[]

      const tenancyIds = links.map((l) => l.tenancy_id)

      const { data, error } = await supabase
        .from('tenancies')
        .select('*, properties(*)')
        .in('id', tenancyIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Tenancy[]
    },
  })
}

export function useTenancy(tenancyId: string | undefined) {
  return useQuery({
    queryKey: ['tenancies', tenancyId],
    queryFn: async () => {
      if (!tenancyId) throw new Error('No tenancy ID')

      const { data, error } = await supabase
        .from('tenancies')
        .select('*')
        .eq('id', tenancyId)
        .single()

      if (error) throw error
      return data as Tenancy
    },
    enabled: !!tenancyId,
  })
}
