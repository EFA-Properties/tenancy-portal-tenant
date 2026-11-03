import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'
import { BrandLogo } from '../components/BrandLogo'
import { AuthFooter } from '../components/AuthFooter'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inactivityLogout = searchParams.get('reason') === 'inactivity'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="brand-auth min-h-screen bg-brand-oat flex flex-col items-center justify-center p-4">
      <Card className="!bg-brand-card !border-2 !border-brand-rose !shadow-none w-full max-w-md">
        <CardBody className="p-8">
          <BrandLogo className="justify-center mb-8" />
          <p className="text-slate-500 mb-8">Sign in to your account</p>

          {inactivityLogout && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              You were signed out due to inactivity. Please sign in again.
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-slate-500 text-sm text-center">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-brand hover:text-brand-dark font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </CardBody>
      </Card>
      <AuthFooter />
    </div>
  )
}
