import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTenancies } from '../../hooks/useTenancies'
import { useDocuments } from '../../hooks/useDocuments'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Download } from 'lucide-react'

export default function DocumentsList() {
  const { user } = useAuth()
  const { data: tenancies } = useTenancies()

  // Get the first active tenancy
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
          <CardBody className="space-y-3">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between gap-3 py-3 ${
                  idx < documents.length - 1 ? 'border-b border-slate-200' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                      {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button variant="ghost" size="sm">
                    <Download size={16} />
                  </Button>
                </a>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
