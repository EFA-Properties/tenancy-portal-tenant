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
        return 'bg-abode-green/10 text-abode-green border border-abode-green'
      case 'awaiting':
      case 'open':
        return 'bg-abode-amber/10 text-abode-amber border border-abode-amber'
      case 'overdue':
        return 'bg-abode-red/10 text-abode-red border border-abode-red'
      default:
        return 'bg-abode-bg3 text-abode-text2 border border-abode-border'
    }
  }

  const getMaintStatusDot = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#2d7a4f'
      case 'in_progress':
        return '#b45309'
      case 'open':
        return '#a8a099'
      default:
        return '#a8a099'
    }
  }

  if (tenanciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-abode-text3">Loading your home...</p>
      </div>
    )
  }

  if (!activeTenancy || !property) {
    return (
      <div className="space-y-4">
        <Card>
          <CardBody>
            <p className="text-abode-text2">
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
        <Card className="border-l-4 border-l-abode-amber">
          <CardHeader className="bg-abode-amber/5 border-b border-abode-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-abode-amber" />
              <h3 className="font-instrument text-sm font-semibold text-abode-text">
                Action Required
              </h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {documentsAwaitingAck.map((doc) => (
              <div key={doc.id}>
                <p className="text-sm font-medium text-abode-text mb-1">
                  {doc.name}
                </p>
                <p className="text-xs text-abode-text2 mb-3">
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
        <CardHeader className="bg-gradient-to-r from-abode-teal to-abode-teal/80 text-white border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-[1px] opacity-90">
              {property.property_type}
            </span>
          </div>
          <h2 className="font-instrument text-lg font-semibold">
            {property.address}
          </h2>
          <p className="text-sm opacity-90">{property.postcode}</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-abode-text3 font-mono uppercase tracking-[1px] mb-1">
                Monthly Rent
              </p>
              <p className="font-instrument text-2xl font-semibold text-abode-text">
                £{activeTenancy.monthly_rent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-abode-text3 font-mono uppercase tracking-[1px] mb-1">
                Move-In Date
              </p>
              <p className="text-sm font-medium text-abode-text">
                {formatDate(activeTenancy.start_date)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Rent Section */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-mono uppercase tracking-[1px] text-abode-text3">
            Rent Payment
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-abode-text2">Amount due</span>
            <span className="font-instrument text-3xl font-semibold text-abode-text">
              £{activeTenancy.monthly_rent}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-abode-text2">Payment status</span>
            <span className="text-xs font-mono uppercase tracking-[1px] px-2 py-1 rounded-full bg-abode-green/10 text-abode-green border border-abode-green">
              Up to date
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-abode-border">
            <div>
              <p className="text-xs text-abode-text3 font-mono uppercase tracking-[1px] mb-1">
                Deposit
              </p>
              <p className="font-medium text-abode-text">
                £{activeTenancy.monthly_rent * 5}
              </p>
            </div>
            <div>
              <p className="text-xs text-abode-text3 font-mono uppercase tracking-[1px] mb-1">
                Next due
              </p>
              <p className="font-medium text-abode-text">
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
            <h3 className="text-sm font-mono uppercase tracking-[1px] text-abode-text3">
              Documents
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {documents.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 pb-3 border-b border-abode-border last:border-b-0">
                <div className="w-8 h-8 rounded bg-abode-bg3 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-abode-text2"
                  >
                    <path d="M2 2h8v12H2V2M6 5h4M6 8h4M6 11h2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-abode-text truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-abode-text3">
                    {formatDate(doc.created_at)}
                  </p>
                </div>
                <span className="text-xs font-mono uppercase tracking-[1px] px-2 py-1 rounded-full bg-abode-bg3 text-abode-text2 border border-abode-border flex-shrink-0">
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
            <h3 className="text-sm font-mono uppercase tracking-[1px] text-abode-text3">
              Maintenance
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {maintenance.slice(0, 3).map((req) => (
              <div key={req.id} className="flex gap-3 pb-3 border-b border-abode-border last:border-b-0">
                <div className="flex-shrink-0 pt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getMaintStatusDot(req.status) }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-abode-text">
                    {req.title}
                  </p>
                  <p className="text-xs text-abode-text3 mt-1">
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
                className="w-full mt-2 border-dashed text-abode-text2 hover:text-abode-text"
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
            <p className="text-sm text-abode-text2 mb-3">
              No maintenance issues reported
            </p>
            <Link to="/maintenance">
              <Button
                variant="outline"
                className="w-full border-dashed text-abode-text2 hover:text-abode-text"
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
