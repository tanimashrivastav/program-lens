'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SpinnerIcon, CompareIcon, UniversityIcon } from '@/components/ui/icons'
import type { ProgramSummary } from '@/lib/services/program-service'
import type { ProgramCompareData } from '@/lib/services/compare-service'

type CompareResult = {
  programs: ProgramCompareData[]
  summary: string
}

const FIELDS: { key: keyof NonNullable<ProgramCompareData['metadata']>; label: string }[] = [
  { key: 'degree', label: 'Degree' },
  { key: 'duration', label: 'Duration' },
  { key: 'location', label: 'Location' },
  { key: 'annualTuitionResident', label: 'Tuition (Resident)' },
  { key: 'annualTuitionNonResident', label: 'Tuition (Non-Resident)' },
  { key: 'averageStartingSalary', label: 'Avg. Starting Salary' },
]

export default function ComparePage() {
  const [available, setAvailable] = useState<ProgramSummary[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/compare')
      .then((r) => r.json())
      .then(setAvailable)
      .catch(() => setError('Failed to load programs'))
  }, [])

  function toggleSelect(slug: string) {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev
    )
    setResult(null)
  }

  async function handleCompare() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 sm:px-8 py-10">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          ← Back to programs
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Compare Programs</h1>
          <p className="text-muted-foreground">
            Select 2–3 programs for a side-by-side breakdown and an AI summary of tradeoffs.
          </p>
        </div>

        {/* Selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
            Select Programs ({selected.length}/3)
          </h2>

          {available.length === 0 && !error ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ready programs yet.{' '}
              <Link href="/" className="text-primary hover:underline">Add one from the dashboard.</Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {available.map((p) => {
                const isSelected = selected.includes(p.slug!)
                const isDisabled = !isSelected && selected.length >= 3
                return (
                  <button
                    key={p.slug}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleSelect(p.slug!)}
                    className={`relative overflow-hidden text-left rounded-xl border p-4 transition-all duration-150 ${
                      isSelected
                        ? 'border-primary/60 bg-primary/10'
                        : isDisabled
                          ? 'border-border/30 bg-card/50 opacity-40 cursor-not-allowed'
                          : 'border-border/50 bg-card hover:border-primary/30 cursor-pointer'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold leading-tight">
                        {p.programName ?? 'Untitled'}
                      </p>
                      {isSelected && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-foreground">
                            {selected.indexOf(p.slug!) + 1}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <UniversityIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{p.universityName ?? '—'}</span>
                    </div>
                    {p.degree && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {p.degree}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Compare button */}
        {selected.length >= 2 && (
          <div className="mb-10">
            <Button onClick={handleCompare} disabled={loading} className="gap-2">
              {loading
                ? <SpinnerIcon className="h-4 w-4 animate-spin" />
                : <CompareIcon className="h-4 w-4" />
              }
              {loading ? 'Comparing...' : 'Compare Selected'}
            </Button>
            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">

            {/* AI Summary */}
            <div className="relative overflow-hidden rounded-xl bg-card border border-primary/15 p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/6 rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                  AI Summary
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">{result.summary}</p>
              </div>
            </div>

            {/* Comparison table */}
            <div className="rounded-xl border border-border/50 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 w-44">
                      Field
                    </th>
                    {result.programs.map((p) => (
                      <th key={p.slug} className="text-left p-4 border-l border-border/50">
                        <p className="font-semibold text-sm leading-tight">{p.programName}</p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">{p.universityName}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map(({ key, label }, i) => (
                    <tr key={key} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                      <td className="p-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        {label}
                      </td>
                      {result.programs.map((p) => (
                        <td key={p.slug} className="p-4 border-l border-border/50">
                          {(p.metadata?.[key] as string | undefined) ?? (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Deadlines */}
                  <tr className="border-b border-border/50 bg-card">
                    <td className="p-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                      Deadlines
                    </td>
                    {result.programs.map((p) => (
                      <td key={p.slug} className="p-4 border-l border-border/50">
                        {p.metadata?.applicationDeadlines?.length ? (
                          <ul className="space-y-1">
                            {p.metadata.applicationDeadlines.map((d, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-primary/50 mt-0.5">·</span>
                                {d}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Top employers */}
                  <tr className="bg-muted/10">
                    <td className="p-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                      Top Employers
                    </td>
                    {result.programs.map((p) => (
                      <td key={p.slug} className="p-4 border-l border-border/50">
                        {p.metadata?.topEmployers?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {p.metadata.topEmployers.slice(0, 5).map((e, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">
                                {e}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* View detail links */}
            <div className="flex flex-wrap gap-3">
              {result.programs.map((p) => (
                <Link key={p.slug} href={`/programs/${p.slug}`}>
                  <Button variant="outline" size="sm">
                    Open {p.programName}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
