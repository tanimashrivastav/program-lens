import { Suspense } from 'react'
import { Nav } from '@/components/nav'
import { IngestForm } from '@/components/programs/ingest-form'
import { ProgramGrid } from '@/components/programs/program-grid'
import { ChatIcon, CompareIcon, DegreeIcon, SpinnerIcon } from '@/components/ui/icons'

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 sm:px-8">

        {/* ── Hero ── */}
        <section className="pt-20 pb-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-medium tracking-wide mb-6">
            AI-powered grad school research
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-5">
            Research grad programs<br />
            <span className="text-primary">without the tab overload.</span>
          </h1>

          <p className="text-xl text-foreground/70 max-w-xl leading-relaxed">
            Paste a URL. Get tuition, deadlines, courses, and AI answers — instantly.
          </p>
        </section>

        {/* ── How it works ── */}
        <section className="py-12 border-t border-border/50">
          <h2 className="text-lg font-semibold mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Step
              number="01"
              icon={<DegreeIcon className="h-6 w-6 text-primary" />}
              title="Paste a program URL"
              description="Any graduate program page works — we handle the scraping across multiple sub-pages automatically."
            />
            <Step
              number="02"
              icon={<ChatIcon className="h-6 w-6 text-primary" />}
              title="We analyze it"
              description="Tuition, deadlines, courses, faculty, and career outcomes are extracted and indexed for search."
            />
            <Step
              number="03"
              icon={<CompareIcon className="h-6 w-6 text-primary" />}
              title="Ask questions & compare"
              description="Chat with any program in plain English, or run a side-by-side comparison across multiple schools."
            />
          </div>
        </section>

        {/* ── Ingest ── */}
        <section className="py-12 border-t border-border/50">
          <div className="relative overflow-hidden max-w-2xl rounded-xl bg-card border border-primary/15 p-6">
            {/* gold shimmer line along the top edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/6 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-lg font-semibold mb-5">
              Add a program
            </h2>
            <IngestForm />
            <p className="text-xs text-muted-foreground/60 font-mono mt-3">
              e.g. https://cs.mit.edu/graduate/ or any MS / MBA / PhD program page
            </p>
          </div>
        </section>

        {/* ── Programs grid ── */}
        <section className="py-12 pb-24 border-t border-border/50">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Your Programs</h2>
            <p className="text-sm text-muted-foreground/80">
              Programs you've added. Click a card to explore details and ask questions.
            </p>
          </div>
          <Suspense fallback={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              Loading programs...
            </div>
          }>
            <ProgramGrid />
          </Suspense>
        </section>

      </main>
    </div>
  )
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative overflow-hidden flex flex-col gap-4 rounded-xl bg-card border border-primary/15 p-6 hover:border-primary/35 transition-colors duration-200">
      {/* gold shimmer line along the top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      {/* subtle gold wash in the top-left corner */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/8 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col gap-3">
        <span className="text-2xl font-bold font-mono text-primary/35">{number}</span>
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 w-fit">
          {icon}
        </div>
      </div>
      <h3 className="relative font-semibold text-base">{title}</h3>
      <p className="relative text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
