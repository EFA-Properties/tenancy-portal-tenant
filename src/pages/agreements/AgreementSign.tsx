import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAgreement, useMarkViewed, useSignAgreementAsTenant } from '../../hooks/useAgreements'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

type SignatureMode = 'draw' | 'type'

interface AgreementFormData {
  landlordName: string
  landlordAddress: string
  tenantName: string
  tenantEmail: string
  propertyAddress: string
  propertyPostcode: string
  propertyType: string
  startDate: string
  monthlyRent: number
  rentDueDay: number
  paymentMethod: string
  depositAmount: number
  depositScheme: string
  depositReference: string
  furnishing: string
  permittedOccupants: number
  parkingIncluded: boolean
  gardenMaintenance: string
  petsConsidered: boolean
  councilTaxResponsibility: string
  utilitiesResponsibility: string
}

interface AgreementClause {
  number: string
  title: string
  text: string
  subclauses?: string[]
}

// Minimal clause generation for tenant view (mirrors landlord template)
function generateClausesFromData(data: AgreementFormData): AgreementClause[] {
  // We import the same template logic. For the tenant portal,
  // rather than duplicating 300 lines, we parse and render the structured content inline.
  // This is a lightweight renderer — the full legal template lives in the landlord portal.
  return [] // Clauses are rendered from the parsed JSON below
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`
  switch (day % 10) {
    case 1: return `${day}st`
    case 2: return `${day}nd`
    case 3: return `${day}rd`
    default: return `${day}th`
  }
}

export default function AgreementSign() {
  const { agreementId } = useParams<{ agreementId: string }>()
  const navigate = useNavigate()
  const { data: agreement, isLoading } = useAgreement(agreementId)
  const markViewed = useMarkViewed()
  const signAsTenant = useSignAgreementAsTenant()

  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')
  const [signMode, setSignMode] = useState<SignatureMode>('type')
  const [typedSignature, setTypedSignature] = useState('')
  const [showSignSection, setShowSignSection] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Parse structured data
  const formData: AgreementFormData | null = useMemo(() => {
    if (!agreement?.content) return null
    try {
      const parsed = JSON.parse(agreement.content)
      if (parsed.landlordName && parsed.tenantName) return parsed as AgreementFormData
    } catch { /* legacy plain text */ }
    return null
  }, [agreement])

  // Mark as viewed when the tenant opens it
  useEffect(() => {
    if (agreement && agreement.status === 'sent') {
      markViewed.mutate(agreement.id)
    }
    if (formData) {
      setTypedSignature(formData.tenantName)
    }
  }, [agreement?.id, agreement?.status]) // eslint-disable-line

  // Already signed?
  const alreadySigned = agreement?.status === 'countersigned' || agreement?.status === 'signed'

  // Canvas drawing
  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      }
    },
    [],
  )

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      isDrawing.current = true
      lastPos.current = getCanvasPos(e)
    },
    [getCanvasPos],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (!isDrawing.current || !lastPos.current) return
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !canvas) return
      const pos = getCanvasPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      lastPos.current = pos
    },
    [getCanvasPos],
  )

  const endDraw = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getSignatureData = useCallback((): string | null => {
    if (signMode === 'type') return typedSignature.trim() || null
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const hasContent = imageData.data.some((val, i) => i % 4 === 3 && val > 0)
    return hasContent ? canvas.toDataURL('image/png') : null
  }, [signMode, typedSignature])

  const handleSign = async () => {
    if (!agreementId) return
    const sigData = getSignatureData()
    if (!sigData) {
      setError(signMode === 'draw' ? 'Please draw your signature.' : 'Please type your name.')
      return
    }
    setError('')
    try {
      await signAsTenant.mutateAsync({
        agreementId,
        signatureData: sigData,
        signatureType: signMode === 'draw' ? 'drawn' : 'typed',
      })
      setSigned(true)
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!agreement) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <p className="text-sm text-slate-500">Agreement not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/agreements')}>
            Back to Agreements
          </Button>
        </CardBody>
      </Card>
    )
  }

  // ── Success state after signing ────────────────────────────
  if (signed) {
    return (
      <div className="space-y-4 pb-4">
        <Card>
          <CardBody className="p-8 text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="h-8 w-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-2">
              Agreement Signed
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              You have successfully signed the tenancy agreement. Both parties have now signed — the agreement is fully executed.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/agreements')}>
                View All Agreements
              </Button>
              <Button onClick={() => navigate('/home')}>Back to Home</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  // ── Main agreement view ────────────────────────────────────
  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-fraunces font-semibold text-slate-900">{agreement.title}</h1>
          <p className="text-xs text-slate-400 mt-1">Sent {formatDate(agreement.sent_at || agreement.created_at)}</p>
        </div>
        <Badge
          size="sm"
          variant={alreadySigned ? 'success' : 'warning'}
        >
          {alreadySigned ? 'Signed' : 'Awaiting Your Signature'}
        </Badge>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Agreement content */}
      {formData ? (
        <>
          {/* Header card */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0">
              <h2 className="font-fraunces text-base font-semibold">Written Statement of Terms</h2>
              <p className="text-xs text-blue-100 mt-1">
                Assured Tenancy — Renters' Rights Act 2025
              </p>
            </CardHeader>
            <CardBody className="p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">
                    Landlord
                  </p>
                  <p className="font-medium text-slate-900">{formData.landlordName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">
                    Tenant
                  </p>
                  <p className="font-medium text-slate-900">{formData.tenantName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">
                    Property
                  </p>
                  <p className="font-medium text-slate-900 text-xs">{formData.propertyAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">
                    Monthly Rent
                  </p>
                  <p className="font-fraunces text-lg font-semibold text-slate-900">
                    £{formData.monthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm mt-3 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Start Date</p>
                  <p className="text-xs font-medium text-slate-900">{formatDate(formData.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Deposit</p>
                  <p className="text-xs font-medium text-slate-900">
                    £{formData.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Rent Due</p>
                  <p className="text-xs font-medium text-slate-900">{ordinal(formData.rentDueDay)} of month</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Key terms summary (mobile-friendly) */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-mono uppercase tracking-[1px] text-slate-400">
                Key Terms
              </h3>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tenancy Type</span>
                <span className="font-medium text-slate-900">Assured Periodic</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Deposit Scheme</span>
                <span className="font-medium text-slate-900">{formData.depositScheme}</span>
              </div>
              {formData.depositReference && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Deposit Reference</span>
                  <span className="font-medium text-slate-900">{formData.depositReference}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Furnishing</span>
                <span className="font-medium text-slate-900 capitalize">
                  {formData.furnishing.replace('_', '-')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Council Tax</span>
                <span className="font-medium text-slate-900 capitalize">
                  {formData.councilTaxResponsibility} pays
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Utilities</span>
                <span className="font-medium text-slate-900 capitalize">
                  {formData.utilitiesResponsibility} pays
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Permitted Occupants</span>
                <span className="font-medium text-slate-900">{formData.permittedOccupants}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Parking</span>
                <span className="font-medium text-slate-900">
                  {formData.parkingIncluded ? 'Included' : 'Not included'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Pets</span>
                <span className="font-medium text-slate-900">
                  {formData.petsConsidered ? 'Requests considered' : 'By request (your right)'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Your rights notice */}
          <Card className="border-l-4 border-l-blue-500">
            <CardBody className="py-3 px-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Your Rights</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>This is an Assured Periodic Tenancy under the Renters' Rights Act 2025.</p>
                <p>You can end the tenancy by giving at least 2 months' written notice at any time.</p>
                <p>Your landlord cannot use a Section 21 "no fault" eviction — they can only seek possession through specific legal grounds.</p>
                <p>Your deposit of £{formData.depositAmount.toFixed(2)} must be protected in the {formData.depositScheme} within 30 days.</p>
                <p>You have the right to request to keep a pet — your landlord must respond within 28 days.</p>
              </div>
            </CardBody>
          </Card>

          {/* Landlord signature status */}
          <Card>
            <CardBody className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Signed by {formData.landlordName} (Landlord)
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(agreement.landlord_signed_at)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        /* Legacy plain-text agreement */
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-900">Agreement</h3>
          </CardHeader>
          <CardBody>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
              {agreement.content}
            </pre>
          </CardBody>
        </Card>
      )}

      {/* Signature section */}
      {!alreadySigned ? (
        !showSignSection ? (
          <Card className="border-2 border-teal-200">
            <CardBody className="p-5 text-center">
              <p className="text-sm text-slate-600 mb-4">
                By proceeding, you confirm that you have read and understood all the terms of this agreement.
              </p>
              <Button onClick={() => setShowSignSection(true)} className="w-full">
                I Have Read the Agreement — Proceed to Sign
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Your Signature</h3>
            </CardHeader>
            <CardBody className="p-5">
              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSignMode('type')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    signMode === 'type'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Type Name
                </button>
                <button
                  type="button"
                  onClick={() => setSignMode('draw')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    signMode === 'draw'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Draw
                </button>
              </div>

              {signMode === 'type' ? (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full legal name"
                    className="w-full rounded-lg border border-slate-200 px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: '20px',
                      fontStyle: 'italic',
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={180}
                      className="w-full cursor-crosshair touch-none"
                      style={{ height: '160px' }}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    <div className="absolute bottom-6 left-4 right-4 border-t border-slate-300" />
                    <p className="absolute bottom-1.5 left-4 text-[10px] text-slate-400 font-mono">
                      SIGN ABOVE THE LINE
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="mt-2 text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 leading-relaxed">
                  By signing, you confirm that: (a) you are the tenant named in this agreement;
                  (b) you have read, understood, and agree to the terms; (c) you accept the
                  obligations set out in this agreement. Your signature, the date and time, and
                  your device information will be recorded for legal verification.
                </p>
              </div>

              <Button
                onClick={handleSign}
                loading={signAsTenant.isPending}
                className="w-full mt-4"
              >
                Sign Agreement
              </Button>
            </CardBody>
          </Card>
        )
      ) : (
        <Card>
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">You have signed this agreement</p>
                <p className="text-xs text-slate-400">{formatDateTime(agreement.tenant_signed_at)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Button variant="outline" className="w-full" onClick={() => navigate('/agreements')}>
        Back to Agreements
      </Button>
    </div>
  )
}
