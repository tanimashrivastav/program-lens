'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SpinnerIcon, SendIcon } from '@/components/ui/icons'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  programId: string
  programName: string | null
  universityName: string | null
}

export function ChatPanel({ programId, programName, universityName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setError(null)

    // Placeholder for the streaming assistant message
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')
      if (!res.body) throw new Error('No response body')

      // Stream the text chunks into the assistant message
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsLoading(false)
    }
  }

  const programLabel =
    [programName, universityName].filter(Boolean).join(' · ') ?? 'this program'

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-0">
        {messages.length === 0 ? (
          <EmptyChat programLabel={programLabel} onSuggestion={(s) => setInput(s)} />
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">AI</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary/15 border border-primary/20 text-foreground'
                    : 'bg-muted border border-border/50 text-foreground'
                }`}
              >
                {m.content || (
                  <SpinnerIcon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          ))
        )}
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this program..."
          disabled={isLoading}
          className="flex-1 bg-muted/50 border-border/50 placeholder:text-muted-foreground/50"
        />
        <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="px-4">
          {isLoading
            ? <SpinnerIcon className="h-4 w-4 animate-spin" />
            : <SendIcon className="h-4 w-4" />
          }
        </Button>
      </form>
    </div>
  )
}

function EmptyChat({
  programLabel,
  onSuggestion,
}: {
  programLabel: string
  onSuggestion: (s: string) => void
}) {
  const suggestions = [
    'What is the tuition?',
    'What are the application deadlines?',
    'What courses are required?',
    'What careers do graduates pursue?',
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 gap-5">
      <div className="text-center">
        <p className="text-sm font-medium mb-1">Ask anything about</p>
        <p className="text-xs text-muted-foreground">{programLabel}</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-muted/50 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
