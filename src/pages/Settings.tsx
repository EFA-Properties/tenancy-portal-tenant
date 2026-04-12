import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function Settings() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
        Profile
      </h2>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
            Account Information
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-slate-400">
            Email address cannot be changed. Contact support if you need to
            update it.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
            Security
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Button variant="secondary" className="w-full">
            Change Password
          </Button>
          <p className="text-xs text-slate-400">
            Keep your account secure by using a strong, unique password.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
            Preferences
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-slate-900">
                Email notifications for maintenance updates
              </span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-slate-900">
                Email notifications for new documents
              </span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm text-slate-900">
                Email notifications for compliance alerts
              </span>
            </label>
          </div>
          <Button onClick={handleSave} className="w-full">
            {saved ? 'Saved!' : 'Save Preferences'}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
