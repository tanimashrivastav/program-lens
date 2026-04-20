import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const TOP_K = 6  // number of chunks to retrieve per query

export type RetrievedChunk = {
  id: string
  content: string
  sourceUrl: string
  programName: string | null
  universityName: string | null
  similarity: number
}

/**
 * Finds the most semantically relevant chunks for a given query vector.
 * Uses pgvector's cosine similarity — closer to 1.0 = more relevant.
 */
export async function retrieveChunks(
  queryEmbedding: number[],
  programId: string,
  topK: number = TOP_K
): Promise<RetrievedChunk[]> {
  // pgvector cosine distance operator: <=>
  // cosine similarity = 1 - cosine distance
  const result = await db.execute(sql`
    SELECT
      id,
      content,
      source_url,
      program_name,
      university_name,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity
    FROM chunks
    WHERE program_id = ${programId}
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `)

  return result.rows.map((row) => ({
    id: row.id as string,
    content: row.content as string,
    sourceUrl: row.source_url as string,
    programName: row.program_name as string | null,
    universityName: row.university_name as string | null,
    similarity: parseFloat(row.similarity as string),
  }))
}
