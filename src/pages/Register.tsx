import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()
  const inviteToken = searchParams.get('invite') || ''

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken)
  const [inviteTenantId, setInviteTenantId] = useState<string | null>(null)
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null)
  const [landlordName, setLandlordName] = useState<string | null>(null)

  // Look up the invite token to pre-fill details
  useEffect(() => {
    if (!inviteToken) return

    const lookupInvite = async () => {
      setInviteLoading(true)
      try {
        // Find the tenant record by invite_token
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, full_name, email, invite_status')
          .eq('invite_token', inviteToken)
          .single()

        if (tenantError || !tenant) {
          setError('This invitation link is invalid or has expired.')
          setInviteLoading(false)
          return
        }

        if (tenant.invite_status === 'registered') {
          setError('This invitation has already been used. Please sign in instead.')
          setInviteLoading(false)
          return
        }

        // Pre-fill the form
        setInviteTenantId(tenant.id)
        setFullName(tenant.full_name || '')
        setEmail(tenant.email || '')

        // Try to get property address from tenancy
        const { data: tenancyTenant } = await supabase
          .from('tenancy_tenants')
          .select('tenancies(property_id, properties(address_line1, town), landlord_id, landlords(full_name))')
          .eq('tenant_id', tenant.id)
          .limit(1)
          .single()

        if (tenancyTenant?.tenancies) {
          const t = tenancyTenant.tenancies as any
          if (t.properties) {
            setPropertyAddress(`${t.properties.address_line1}, ${t.properties.town}`)
          }
          if (t.landlords) {
            setLandlordName(t.landlords.full_name)
          }
        }
      } catch (err) {
        console.error('Invite lookup error:', err)
        setError('Could not load invitation details.')
      } finally {
        setInviteLoading(false)
      }
    }

    lookupInvite()
  }, [inviteToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register(email, password, fullName)

      // If this was an invite registration, link the tenant record
      if (inviteTenantId) {
        const { data: { user: newUser } } = await supabase.auth.getUser()
        if (newUser) {
          await supabase
            .from('tenants')
            .update({
              auth_user_id: newUser.id,
              invite_status: 'registered',
            })
            .eq('id', inviteTenantId)
        }
      }

      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
              </svg>
            </div>
            <h1 className="text-2xl font-fraunces font-bold text-slate-900">Tenancy Portal</h1>
          </div>
          {inviteLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {inviteToken && (propertyAddress || landlordName) ? (
                <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-teal-800 text-sm font-medium mb-1">You've been invited to the Tenancy Portal</p>
                  {landlordName && (
                    <p className="text-teal-700 text-sm">By: {landlordName}</p>
                  )}
                  {propertyAddress && (
                    <p className="text-teal-700 text-sm">Property: {propertyAddress}</p>
                  )}
                  <p className="text-teal-600 text-xs mt-2">Create your account below to access your tenancy documents and details.</p>
                </div>
              ) : !inviteToken ? (
                <p className="text-slate-500 mb-8">Create your tenant account</p>
              ) : (
                <p className="text-slate-500 mb-8">Create your tenant account</p>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
              disabled={!!inviteTenantId}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              disabled={!!inviteTenantId}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-slate-500 text-sm text-center">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:text-slate-900 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
