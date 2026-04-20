'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpinnerIcon, DeleteIcon, ExternalLinkIcon, DegreeIcon, UniversityIcon, PendingIcon, SuccessIcon, ErrorIcon } from '@/components/ui/icons'
import type { ProgramSummary } from '@/lib/services/program-service'

type Props = {
  program: ProgramSummary
}

const POLL_INTERVAL = 4000 // ms

export function ProgramCard({ program }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const isReady = program.ingestionStatus === 'done'
  const isProcessing = program.ingestionStatus === 'processing' || program.ingestionStatus === 'pending'
  const isError = program.ingestionStatus === 'error'

  // Poll while processing — refresh the server component tree when status changes
  useEffect(() => {
    if (!isProcessing || !program.slug) return

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/programs/${program.slug}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.ingestionStatus === 'done' || data.ingestionStatus === 'error') {
          router.refresh()
        }
      } catch {
        // silent — polling failures shouldn't break the UI
      }
    }, POLL_INTERVAL)

    return () => clearInterval(id)
  }, [isProcessing, program.slug, router])

  async function handleDelete() {
    if (!program.slug) return
    if (!confirm(`Remove ${program.programName ?? 'this program'}?`)) return

    setDeleting(true)
    try {
      await fetch(`/api/programs/${program.slug}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="flex flex-col bg-card border-border/50 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <StatusIndicator status={program.ingestionStatus} />
          {program.degree && (
            <Badge variant="secondary" className="text-xs font-mono">
              {program.degree}
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-base leading-tight mt-2">
          {program.programName ?? 'Untitled Program'}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <UniversityIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{program.universityName ?? '—'}</span>
        </div>

        {program.college && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <DegreeIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{program.college}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {isProcessing && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <SpinnerIcon className="h-3 w-3 animate-spin" />
            Analyzing program...
          </p>
        )}
        {isError && (
          <p className="text-xs text-destructive">Failed to process. Click delete to retry.</p>
        )}
      </CardContent>

      <CardFooter className="pt-0 gap-3">
        {isReady && program.slug ? (
          <Link href={`/programs/${program.slug}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full gap-1.5">
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              View Program
            </Button>
          </Link>
        ) : (
          <Button variant="default" size="sm" className="flex-1" disabled>
            {isProcessing ? 'Processing...' : 'Unavailable'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting
            ? <SpinnerIcon className="h-4 w-4 animate-spin" />
            : <DeleteIcon className="h-4 w-4" />
          }
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatusIndicator({ status }: { status: string }) {
  if (status === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
        <SuccessIcon className="h-3.5 w-3.5" />
        Ready
      </span>
    )
  }
  if (status === 'processing' || status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-500">
        <PendingIcon className="h-3.5 w-3.5" />
        Processing
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-destructive">
      <ErrorIcon className="h-3.5 w-3.5" />
      Error
    </span>
  )
}
