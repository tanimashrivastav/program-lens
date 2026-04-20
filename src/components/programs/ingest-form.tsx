'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SpinnerIcon, AddIcon } from '@/components/ui/icons'

export function IngestForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }

      setUrl('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add program')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://cs.mit.edu/graduate/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="flex-1 h-11 bg-muted/50 border-border/50 placeholder:text-muted-foreground/50"
        />
        <Button type="submit" disabled={loading || !url.trim()} className="h-11 px-5 gap-2">
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <AddIcon className="h-4 w-4" />
          )}
          {loading ? 'Adding...' : 'Add Program'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </form>
  )
}
