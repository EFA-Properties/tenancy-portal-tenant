import React, { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTenancies } from '../../hooks/useTenancies'
import { useDocuments } from '../../hooks/useDocuments'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate, formatDateTime } from '../../lib/utils'
import { supabase } from '../../lib/supabase'

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

export default function DocumentsList() {
  const { user } = useAuth()
  const { data: tenancies } = useTenancies()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const activeTenancy = useMemo(
    () => tenancies?.find((t) => t.status === 'active') || tenancies?.[0],
    [tenancies]
  )

  const { data: documents = [], isLoading } = useDocuments(activeTenancy?.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
        Documents
      </h2>

      {documents.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No documents yet"
              description="Your documents will appear here."
              action={{ label: 'Go to Home', onClick: () => window.location.href = '/home' }}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Document</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Uploaded</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Accepted</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Valid To</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {documents.map((doc) => {
                  const docTitle = doc.title || docTypeLabels[doc.document_type] || doc.name || doc.file_name || 'Untitled'
                  const docTypeName = docTypeLabels[doc.document_type] || doc.document_type || doc.type || ''

                  let statusLabel = 'Available'
                  let statusColor = 'text-slate-500 bg-slate-100'
                  if (doc.tenant_confirmed_at) {
                    statusLabel = 'Accepted'
                    statusColor = 'text-green-600 bg-green-50'
                  } else if (doc.tenant_opened_at) {
                    statusLabel = 'Viewed'
                    statusColor = 'text-blue-600 bg-blue-50'
                  }

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
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor}`}>
                          {statusLabel}
                        </span>
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
    </div>
  )
}
