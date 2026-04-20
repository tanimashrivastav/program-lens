import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CompareIcon } from '@/components/ui/icons'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary font-bold text-lg tracking-tight">
            Program<span className="text-foreground">Lens</span>
          </span>
        </Link>

        <Link href="/compare">
          <Button variant="outline" size="sm" className="gap-2">
            <CompareIcon className="h-4 w-4" />
            Compare
          </Button>
        </Link>
      </div>
    </header>
  )
}
