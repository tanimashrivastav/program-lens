import { getAllPrograms } from '@/lib/services/program-service'
import { ProgramCard } from './program-card'
import { EmptyStateIcon } from '@/components/ui/icons'

export async function ProgramGrid() {
  const programs = await getAllPrograms()

  if (programs.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <p className="text-xs font-mono text-muted-foreground/70 mb-6">
        {programs.length} {programs.length === 1 ? 'program' : 'programs'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-24 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <EmptyStateIcon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-1">No programs yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Paste a program URL above to start building your research list.
      </p>
    </div>
  )
}
