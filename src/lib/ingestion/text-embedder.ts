import { openai } from '@ai-sdk/openai'
import { embed, embedMany } from 'ai'
import type { TextChunk } from './text-chunker'

const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small')
const BATCH_SIZE = 100  // OpenAI allows up to 2048 inputs per request, 100 is safe

export type EmbeddedChunk = TextChunk & {
  embedding: number[]
}

/**
 * Embeds all chunks in batches and returns them with their vectors attached.
 */
export async function embedChunks(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
  const results: EmbeddedChunk[] = []

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)

    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: batch.map((c) => c.content),
    })

    for (let j = 0; j < batch.length; j++) {
      results.push({ ...batch[j], embedding: embeddings[j] })
    }

    console.log(`[embedder] embedded chunks ${i + 1}–${i + batch.length} of ${chunks.length}`)
  }

  return results
}

/**
 * Embeds a single string — used at query time to embed the user's question.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  })
  return embedding
}
