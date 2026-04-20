import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProgramBySlug } from '@/lib/services/program-service'
import { Nav } from '@/components/nav'
import { ChatPanel } from '@/components/programs/chat-panel'
import { Badge } from '@/components/ui/badge'
import type { ProgramMetadata } from '@/lib/services/extraction-service'
import {
  DegreeIcon,
  UniversityIcon,
  TuitionIcon,
  DeadlineIcon,
  ExternalLinkIcon,
  CourseIcon,
} from '@/components/ui/icons'

export default async function ProgramDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const program = await getProgramBySlug(slug)

  if (!program || program.ingestionStatus !== 'done') notFound()

  const meta = program.metadata as ProgramMetadata | null

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 sm:px-8 py-10">

        {/* ── Back ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          ← Back to programs
        </Link>

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            {program.degree && (
              <Badge variant="secondary" className="font-mono text-xs">
                {program.degree}
              </Badge>
            )}
            <a
              href={program.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLinkIcon className="h-3 w-3" />
              Program website
            </a>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {program.programName ?? 'Untitled Program'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UniversityIcon className="h-4 w-4" />
              {program.universityName ?? '—'}
            </span>
            {program.college && (
              <span className="flex items-center gap-1.5">
                <DegreeIcon className="h-4 w-4" />
                {program.college}
              </span>
            )}
            {program.department && (
              <span className="text-muted-foreground/60">{program.department}</span>
            )}
          </div>
        </div>

        {/* ── Main layout: stats left, chat right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Stats panel (2/5) ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">
              Program Details
            </h2>

            {meta?.annualTuitionResident && (
              <StatCard
                icon={<TuitionIcon className="h-4 w-4 text-primary" />}
                label="Tuition (Resident)"
                value={meta.annualTuitionResident}
              />
            )}
            {meta?.annualTuitionNonResident && (
              <StatCard
                icon={<TuitionIcon className="h-4 w-4 text-primary" />}
                label="Tuition (Non-Resident)"
                value={meta.annualTuitionNonResident}
              />
            )}
            {meta?.duration && (
              <StatCard
                icon={<CourseIcon className="h-4 w-4 text-primary" />}
                label="Duration"
                value={meta.duration}
              />
            )}
            {meta?.location && (
              <StatCard
                icon={<UniversityIcon className="h-4 w-4 text-primary" />}
                label="Location"
                value={meta.location}
              />
            )}
            {meta?.averageStartingSalary && (
              <StatCard
                icon={<TuitionIcon className="h-4 w-4 text-primary" />}
                label="Avg. Starting Salary"
                value={meta.averageStartingSalary}
              />
            )}
            {meta?.applicationDeadlines && meta.applicationDeadlines.length > 0 && (
              <div className="rounded-xl bg-card border border-primary/15 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DeadlineIcon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Application Deadlines
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {meta.applicationDeadlines.map((d, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-primary/50 mt-0.5">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meta?.topEmployers && meta.topEmployers.length > 0 && (
              <div className="rounded-xl bg-card border border-primary/15 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UniversityIcon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Top Employers
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meta.topEmployers.map((e, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border/50 text-muted-foreground"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!meta && (
              <p className="text-sm text-muted-foreground/60 italic">
                No structured data extracted.
              </p>
            )}
          </div>

          {/* ── Chat panel (3/5) ── */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
              Ask Questions
            </h2>
            <div className="relative overflow-hidden rounded-xl bg-card border border-primary/15 p-5" style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>
              {/* shimmer line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/6 rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex-1 flex flex-col min-h-0">
                <ChatPanel
                  programId={program.id}
                  programName={program.programName}
                  universityName={program.universityName}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-card border border-primary/15 px-4 py-3 flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}
