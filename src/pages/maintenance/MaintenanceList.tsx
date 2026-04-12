import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTenancies } from '../../hooks/useTenancies'
import { useMaintenanceRequests } from '../../hooks/useMaintenanceRequests'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'

export default function MaintenanceList() {
  const { user } = useAuth()
  const { data: tenancies } = useTenancies()

  // Get the first active tenancy
  const activeTenancy = useMemo(
    () => tenancies?.find((t) => t.status === 'active') || tenancies?.[0],
    [tenancies]
  )

  const { data: requests = [], isLoading } = useMaintenanceRequests(activeTenancy?.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return 'secondary'
      case 'resolved':
        return 'success'
      case 'closed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
        Maintenance
      </h2>

      {requests.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No maintenance requests"
              description="Your property is in good shape! Report an issue if you need maintenance."
              action={{
                label: 'Report an Issue',
                onClick: () => (window.location.href = '/maintenance/new'),
              }}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-3">
            {requests.map((request, idx) => (
              <div
                key={request.id}
                className={`py-3 ${
                  idx < requests.length - 1 ? 'border-b border-slate-200' : ''
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {request.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Reported{' '}
                      {new Date(request.created_at).toLocaleDateString(
                        'en-GB'
                      )}
                    </p>
                  </div>
                  <Link to={`/maintenance/${request.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={getPriorityColor(request.priority)}>
                    {request.priority}
                  </Badge>
                  <Badge variant={getStatusColor(request.status)}>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
