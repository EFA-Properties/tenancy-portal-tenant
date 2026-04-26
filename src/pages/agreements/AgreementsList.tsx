import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenancies } from '../../hooks/useTenancies'
import { useAgreements } from '../../hooks/useAgreements'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

const statusVariant: Record<string, 'secondary' | 'warning' | 'success' | 'outline'> = {
  sent: 'warning',
  viewed: 'outline',
  signed: 'success',
  countersigned: 'success',
}

const statusLabel: Record<string, string> = {
  sent: 'Action Required',
  viewed: 'Review & Sign',
  signed: 'Signed by You',
  countersigned: 'Fully Signed',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AgreementsList() {
  const navigate = useNavigate()
  const { data: tenancies } = useTenancies()

  const activeTenancy = useMemo(
    () => tenancies?.find((t) => t.status === 'active') || tenancies?.[0],
    [tenancies],
  )

  const { data: agreements = [], isLoading } = useAgreements(activeTenancy?.id)

  const pendingCount = agreements.filter((a) => a.status === 'sent' || a.status === 'viewed').length

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-fraunces font-semibold text-slate-900">
        Agreements
      </h1>

      {pendingCount > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-sm font-medium text-slate-900">
                {pendingCount} agreement{pendingCount > 1 ? 's' : ''} awaiting your signature
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
        </div>
      ) : agreements.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No agreements yet. Your landlord will send tenancy agreements here for your review and signature.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {agreements.map((a) => {
            const needsAction = a.status === 'sent' || a.status === 'viewed'
            return (
              <Card
                key={a.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  needsAction ? 'ring-1 ring-amber-200' : ''
                }`}
                onClick={() => navigate(`/agreements/${a.id}`)}
              >
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate flex-1">
                      {a.title}
                    </h3>
                    <Badge size="sm" variant={statusVariant[a.status] || 'secondary'}>
                      {statusLabel[a.status] || a.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{a.type === 'inventory' ? 'Inventory' : 'Tenancy Agreement'}</span>
                    <span>Sent {formatDate(a.sent_at || a.created_at)}</span>
                    {a.tenant_signed_at && (
                      <span>You signed {formatDate(a.tenant_signed_at)}</span>
                    )}
                  </div>
                  {needsAction && (
                    <div className="mt-3">
                      <Button size="sm" className="w-full">
                        Review & Sign
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
