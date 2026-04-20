import type { RetrievedChunk } from './chunk-retriever'

/**
 * Builds the system prompt Claude receives for every chat message.
 * Includes retrieved chunks as context so Claude can answer accurately.
 */
export function buildSystemPrompt(
  chunks: RetrievedChunk[],
  programName: string | null,
  universityName: string | null
): string {
  const programLabel = [programName, universityName].filter(Boolean).join(' — ') || 'this program'

  const context = chunks
    .map((chunk, i) => `[Source ${i + 1}] ${chunk.content}`)
    .join('\n\n---\n\n')

  return `You are a knowledgeable academic advisor helping a student research ${programLabel}.

Answer questions using ONLY the context provided below. If the answer is not in the context, say so clearly — do not make up information.

Be concise and direct. Use bullet points for lists. When referencing specific facts like tuition or deadlines, be precise.

--- CONTEXT ---
${context}
--- END CONTEXT ---`
}
