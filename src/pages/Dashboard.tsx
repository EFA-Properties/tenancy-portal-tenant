import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTenancies } from '../hooks/useTenancies'
import { useDocuments } from '../hooks/useDocuments'
import { useMaintenanceRequests } from '../hooks/useMaintenanceRequests'
import { useProperty } from '../hooks/useProperties'
import { useLandlordInfo } from '../hooks/useLandlordInfo'
import { useAgreements } from '../hooks/useAgreements'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatDate, formatDateTime } from '../lib/utils'
import { supabase } from '../lib/supabase'

const docTypeLabels: Record<string, string> = {
  ast: 'Tenancy Agreement',
  epc: 'EPC Certificate',
  gas_safety: 'Gas Safety Certificate (CP12)',
  eicr: 'EICR (Electrical Safety)',
  inventory: 'Inventory & Schedule of Condition',
  deposit_certificate: 'Deposit Protection Certificate',
  how_to_rent: 'How to Rent Guide',
  renter_rights: "Renter's Rights",
  right_to_rent: 'Right to Rent Check',
  hmo_licence: 'HMO Licence',
  emergency_lighting: 'Emergency Lighting Report',
  fire_risk_assessment: 'Fire Risk Assessment',
  fire_emergency_procedures: 'Fire & Emergency Procedures',
  house_rules: 'House Rules / Guidance',
  other: 'Other Document',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: tenancies, isLoading: tenanciesLoading } = useTenancies()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Get the first active tenancy (tenant perspective)
  const activeTenancy = useMemo(
    () => tenancies?.find((t) => t.status === 'active') || tenancies?.[0],
    [tenancies]
  )

  // Fetch property, landlord info, documents, and maintenance for the active tenancy
  const { data: property } = useProperty(activeTenancy?.property_id)
  const { data: landlordInfo } = useLandlordInfo(activeTenancy?.property_id)
  const { data: documents, isLoading: docsLoading } = useDocuments(
    activeTenancy?.id
  )
  const { data: maintenance, isLoading: maintenanceLoading } =
    useMaintenanceRequests(activeTenancy?.id)
  const { data: agreements } = useAgreements(activeTenancy?.id)

  // Agreements awaiting tenant signature
  const pendingAgreements = agreements?.filter(
    (a) => a.status === 'sent' || a.status === 'viewed'
  )

  // Check if any documents are awaiting acknowledgement
  const documentsAwaitingAck = documents?.filter(
    (d) => d.type === 'lease_agreement'
  ) // Assuming lease agreements need ack

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
      {/* Agreements Awaiting Signature */}
      {pendingAgreements && pendingAgreements.length > 0 && (
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="bg-teal-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <h3 className="font-fraunces text-sm font-semibold text-slate-900">
                Agreement{pendingAgreements.length > 1 ? 's' : ''} to Sign
              </h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {pendingAgreements.map((agreement) => (
              <div key={agreement.id}>
                <p className="text-sm font-medium text-slate-900 mb-1">
                  {agreement.title}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Your landlord has sent this for your review and signature.
                </p>
                <Link to={`/agreements/${agreement.id}`}>
                  <Button variant="default" size="sm" className="w-full">
                    Review & Sign
                  </Button>
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

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

      {/* Landlord Contact */}
      {landlordInfo && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#0f766e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="6" r="3" />
                  <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-mono uppercase tracking-[1px] mb-0.5">
                  Your Landlord
                </p>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {landlordInfo.full_name}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {landlordInfo.email && (
                  <a
                    href={`mailto:${landlordInfo.email}`}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    title="Email landlord"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="16" height="12" rx="1" />
                      <path d="M2 4l8 6 8-6" />
                    </svg>
                  </a>
                )}
                {landlordInfo.phone && (
                  <a
                    href={`tel:${landlordInfo.phone}`}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    title="Call landlord"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h4l2 5-2.5 1.5A11 11 0 0010.5 13.5L12 11l5 2v4a1 1 0 01-1 1A15 15 0 013 3z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
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

      {/* Documents Table */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
                Your Documents
              </h3>
              <Link to="/documents">
                <span className="text-xs font-medium text-blue-600 hover:text-blue-700">View all</span>
              </Link>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Document</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Uploaded</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Accepted</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Valid To</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {documents.map((doc) => {
                  const docTitle = doc.title || docTypeLabels[doc.document_type] || doc.name || doc.file_name || 'Untitled'
                  const docTypeName = docTypeLabels[doc.document_type] || doc.document_type || doc.type || ''

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 truncate">{docTitle}</p>
                        <span className="text-xs text-slate-400">{docTypeName}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatDateTime(doc.uploaded_at || doc.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {doc.tenant_confirmed_at ? (
                          <span className="text-green-600 font-medium">{formatDateTime(doc.tenant_confirmed_at)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {doc.valid_to ? (
                          <span className={new Date(doc.valid_to) < new Date() ? 'text-red-600 font-medium' : 'text-slate-500'}>
                            {formatDate(doc.valid_to)}
                            {new Date(doc.valid_to) < new Date() && ' (expired)'}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setDownloadingId(doc.id)
                            try {
                              if (doc.url?.startsWith('http') || doc.file_path?.startsWith('http')) {
                                window.open(doc.url || doc.file_path, '_blank')
                              } else if (doc.file_path) {
                                const bucket = doc.scope === 'property' ? 'property-documents' : 'tenancy-documents'
                                const { data, error } = await supabase.storage.from(bucket).createSignedUrl(doc.file_path, 3600)
                                if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank')
                              }
                            } finally {
                              setDownloadingId(null)
                            }
                          }}
                          loading={downloadingId === doc.id}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
