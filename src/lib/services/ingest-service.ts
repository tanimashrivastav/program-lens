import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { chunks, programs } from '@/lib/db/schema'
import { crawlProgram } from '@/lib/ingestion/web-scraper'
import { chunkText } from '@/lib/ingestion/text-chunker'
import { embedChunks } from '@/lib/ingestion/text-embedder'
import { extractProgramMetadata } from '@/lib/services/extraction-service'
import { generateSlug, makeSlugUnique } from '@/lib/utils/slug'

// ---- Types ----

export type IngestResult =
  | { status: 'created'; programId: string }
  | { status: 'existing'; programId: string; ingestionStatus: string }
  | { status: 'retrying'; programId: string }

// ---- Public API ----

/**
 * Entry point for the ingest flow.
 * Checks if the URL already exists and handles each case,
 * then kicks off the background pipeline.
 */
export async function startIngestion(url: string): Promise<IngestResult> {
  const existing = await findProgramByUrl(url)

  if (existing) {
    if (['done', 'processing', 'pending'].includes(existing.ingestionStatus)) {
      return { status: 'existing', programId: existing.id, ingestionStatus: existing.ingestionStatus }
    }

    if (existing.ingestionStatus === 'error') {
      await resetProgramStatus(existing.id)
      runIngestionPipeline(existing.id, url)
      return { status: 'retrying', programId: existing.id }
    }
  }

  const program = await createProgramRow(url)
  runIngestionPipeline(program.id, url)
  return { status: 'created', programId: program.id }
}

// ---- Private helpers ----

async function findProgramByUrl(url: string) {
  const results = await db
    .select()
    .from(programs)
    .where(eq(programs.sourceUrl, url))
    .limit(1)

  return results[0] ?? null
}

async function createProgramRow(url: string) {
  const [program] = await db
    .insert(programs)
    .values({ sourceUrl: url, ingestionStatus: 'pending' })
    .returning()
  return program
}

async function resetProgramStatus(programId: string) {
  await db
    .update(programs)
    .set({ ingestionStatus: 'pending', errorMessage: null })
    .where(eq(programs.id, programId))
}

/**
 * Runs the full ingestion pipeline in the background.
 * Intentionally not awaited — the route returns immediately.
 *
 * Steps:
 *   1. Crawl all relevant pages under the submitted URL
 *   2. Split combined text into overlapping chunks
 *   3. Embed each chunk via OpenAI
 *   4. Bulk insert chunks into the DB
 *   5. Mark the program as done
 */
async function runIngestionPipeline(programId: string, url: string) {
  try {
    await markProgramStatus(programId, 'processing')

    // Step 1 — Crawl
    const { combinedText, pagesCrawled } = await crawlProgram(url)

    if (!combinedText || combinedText.length < 100) {
      throw new Error(`Could not extract enough content from ${url}`)
    }

    console.log(`[ingestion-service] crawled ${pagesCrawled.length} pages, ${combinedText.length} chars`)

    // Step 2 — Chunk
    const textChunks = await chunkText(combinedText)
    console.log(`[ingestion-service] split into ${textChunks.length} chunks`)

    // Step 3 — Embed
    const embeddedChunks = await embedChunks(textChunks)
    console.log(`[ingestion-service] embedded ${embeddedChunks.length} chunks`)

    // Step 4 — Extract structured metadata via Claude
    const metadata = await extractProgramMetadata(combinedText, url)
    console.log(`[ingest-service] extracted metadata for ${metadata?.programName ?? 'unknown program'}`)

    // Step 5 — Generate slug from extracted names
    const programName = metadata?.programName ?? new URL(url).hostname
    const universityName = metadata?.universityName ?? new URL(url).hostname
    const slug = await generateUniqueSlug(programName, universityName)

    // Step 6 — Bulk insert chunks
    await db.insert(chunks).values(
      embeddedChunks.map((chunk) => ({
        programId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding,
        sourceUrl: url,
        programName,
        universityName,
        tokenCount: chunk.tokenCount,
      }))
    )

    // Step 7 — Mark done with all extracted data
    await db
      .update(programs)
      .set({
        ingestionStatus: 'done',
        rawText: combinedText,
        lastScrapedAt: new Date(),
        programName,
        universityName,
        slug,
        degree: metadata?.degree ?? null,
        college: metadata?.college ?? null,
        department: metadata?.department ?? null,
        metadata: metadata ?? null,
      })
      .where(eq(programs.id, programId))

    console.log(`[ingestion-service] done for ${url}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[ingestion-service] error for ${url}:`, message)
    await markProgramStatus(programId, 'error', message)
  }
}

/**
 * Generates a slug and ensures it's unique in the DB.
 * Appends a numeric suffix if a collision is found.
 */
async function generateUniqueSlug(programName: string, universityName: string): Promise<string> {
  const base = generateSlug(universityName, programName)
  let slug = base
  let suffix = 2

  while (true) {
    const existing = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.slug, slug))
      .limit(1)

    if (existing.length === 0) return slug

    slug = makeSlugUnique(base, suffix)
    suffix++
  }
}

async function markProgramStatus(
  programId: string,
  status: 'pending' | 'processing' | 'done' | 'error',
  errorMessage?: string
) {
  await db
    .update(programs)
    .set({ ingestionStatus: status, ...(errorMessage ? { errorMessage } : {}) })
    .where(eq(programs.id, programId))
}
