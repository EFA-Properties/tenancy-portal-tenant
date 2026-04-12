import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTenancies } from '../hooks/useTenancies'
import { useDocuments } from '../hooks/useDocuments'
import { useMaintenanceRequests } from '../hooks/useMaintenanceRequests'
import { useProperty } from '../hooks/useProperties'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: tenancies, isLoading: tenanciesLoading } = useTenancies()

  // Get the first active tenancy (tenant perspective)
  const activeTenancy = useMemo(
    () => tenancies?.find((t) => t.status === 'active') || tenancies?.[0],
    [tenancies]
  )

  // Fetch property, documents, and maintenance for the active tenancy
  const { data: property } = useProperty(activeTenancy?.property_id)
  const { data: documents, isLoading: docsLoading } = useDocuments(
    activeTenancy?.id
  )
  const { data: maintenance, isLoading: maintenanceLoading } =
    useMaintenanceRequests(activeTenancy?.id)

  // Check if any documents are awaiting acknowledgement
  const documentsAwaitingAck = documents?.filter(
    (d) => d.type === 'lease_agreement'
  ) // Assuming lease agreements need ack

  // Format dates
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Status pill helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'resolved':
        return 'bg-green-50 text-green-600 border border-green-200'
      case 'awaiting':
      case 'open':
        return 'bg-amber-50 text-amber-600 border border-amber-200'
      case 'overdue':
        return 'bg-red-50 text-red-600 border border-red-200'
      default:
        return 'bg-slate-100 text-slate-500 border border-slate-200'
    }
  }

  const getMaintStatusDot = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#16a34a'
      case 'in_progress':
        return '#f59e0b'
      case 'open':
        return '#cbd5e1'
      default:
        return '#cbd5e1'
    }
  }

  if (tenanciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading your home...</p>
      </div>
    )
  }

  if (!activeTenancy || !property) {
    return (
      <div className="space-y-4">
        <Card>
          <CardBody>
            <p className="text-slate-500">
              No active tenancy found. Please contact support.
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Action Required Section */}
      {documentsAwaitingAck && documentsAwaitingAck.length > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="bg-amber-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="font-fraunces text-sm font-semibold text-slate-900">
                Action Required
              </h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {documentsAwaitingAck.map((doc) => (
              <div key={doc.id}>
                <p className="text-sm font-medium text-slate-900 mb-1">
                  {doc.name}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Please review and confirm you have received this document.
                </p>
                <Button variant="default" size="sm" className="w-full">
                  I confirm I have received this document
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Your Home Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-[1px] opacity-90">
              {property.property_type}
            </span>
          </div>
          <h2 className="font-fraunces text-lg font-semibold">
            {property.address}
          </h2>
          <p className="text-sm opacity-90">{property.postcode}</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-[1px] mb-1">
                Monthly Rent
              </p>
              <p className="font-fraunces text-2xl font-semibold text-slate-900">
                £{activeTenancy.monthly_rent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-[1px] mb-1">
                Move-In Date
              </p>
              <p className="text-sm font-medium text-slate-900">
                {formatDate(activeTenancy.start_date)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Rent Section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
            Rent Payment
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-slate-500">Amount due</span>
            <span className="font-fraunces text-3xl font-semibold text-slate-900">
              £{activeTenancy.monthly_rent}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Payment status</span>
            <span className="text-xs font-mono uppercase tracking-[1px] px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
              Up to date
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-[1px] mb-1">
                Deposit
              </p>
              <p className="font-medium text-slate-900">
                £{activeTenancy.monthly_rent * 5}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-[1px] mb-1">
                Next due
              </p>
              <p className="font-medium text-slate-900">
                {formatDate(
                  new Date(activeTenancy.start_date).toISOString()
                )}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Documents Section */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
              Documents
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {documents.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 pb-3 border-b border-slate-200 last:border-b-0">
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-slate-500"
                  >
                    <path d="M2 2h8v12H2V2M6 5h4M6 8h4M6 11h2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(doc.created_at)}
                  </p>
                </div>
                <span className="text-xs font-mono uppercase tracking-[1px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex-shrink-0">
                  Read
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Maintenance Section */}
      {maintenance && maintenance.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
              Maintenance
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {maintenance.slice(0, 3).map((req) => (
              <div key={req.id} className="flex gap-3 pb-3 border-b border-slate-200 last:border-b-0">
                <div className="flex-shrink-0 pt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getMaintStatusDot(req.status) }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {req.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Reported {formatDate(req.created_at)}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono uppercase tracking-[1px] px-2 py-1 rounded-full flex-shrink-0 ${getStatusColor(
                    req.status
                  )}`}
                >
                  {req.status === 'in_progress' ? 'In Progress' : req.status}
                </span>
              </div>
            ))}
            <Link to="/maintenance">
              <Button
                variant="outline"
                className="w-full mt-2 border-dashed text-slate-500 hover:text-slate-900"
              >
                Report a new issue
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Empty state for maintenance */}
      {(!maintenance || maintenance.length === 0) && (
        <Card>
          <CardBody className="text-center py-6">
            <p className="text-sm text-slate-500 mb-3">
              No maintenance issues reported
            </p>
            <Link to="/maintenance">
              <Button
                variant="outline"
                className="w-full border-dashed text-slate-500 hover:text-slate-900"
              >
                Report a maintenance issue
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
