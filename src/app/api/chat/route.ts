import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { getProgramById } from '@/lib/services/program-service'
import { retrieveChunks } from '@/lib/services/chunk-retriever'
import { buildSystemPrompt } from '@/lib/services/chat-prompt-builder'
import { embedQuery } from '@/lib/ingestion/text-embedder'

export async function POST(request: Request) {
  const { programId, messages } = await request.json()

  if (!programId || !messages?.length) {
    return Response.json({ error: 'programId and messages are required' }, { status: 400 })
  }

  const program = await getProgramById(programId)
  if (!program) {
    return Response.json({ error: 'Program not found' }, { status: 404 })
  }

  // Embed the latest user message for retrieval
  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
  const queryEmbedding = await embedQuery(lastUserMessage?.content ?? '')
  const relevantChunks = await retrieveChunks(queryEmbedding, programId)

  const systemPrompt = buildSystemPrompt(
    relevantChunks,
    program.programName,
    program.universityName
  )

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: systemPrompt,
    messages,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
