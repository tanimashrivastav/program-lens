import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { programs } from '@/lib/db/schema'

// ---- Types ----

export type ProgramSummary = {
  id: string
  slug: string | null
  sourceUrl: string
  programName: string | null
  universityName: string | null
  college: string | null
  degree: string | null
  ingestionStatus: string
  lastScrapedAt: Date | null
  createdAt: Date
}

export type ProgramDetail = ProgramSummary & {
  department: string | null
  metadata: unknown
  errorMessage: string | null
}

// ---- Public API ----

/**
 * Returns all programs for the dashboard grid.
 * Excludes raw text to keep the payload small.
 */
export async function getAllPrograms(): Promise<ProgramSummary[]> {
  const results = await db
    .select({
      id: programs.id,
      slug: programs.slug,
      sourceUrl: programs.sourceUrl,
      programName: programs.programName,
      universityName: programs.universityName,
      college: programs.college,
      degree: programs.degree,
      ingestionStatus: programs.ingestionStatus,
      lastScrapedAt: programs.lastScrapedAt,
      createdAt: programs.createdAt,
    })
    .from(programs)
    .orderBy(programs.createdAt)

  return results
}

/**
 * Returns a single program by slug with full detail including metadata.
 * Used for the program detail page.
 */
export async function getProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  const results = await db
    .select({
      id: programs.id,
      slug: programs.slug,
      sourceUrl: programs.sourceUrl,
      programName: programs.programName,
      universityName: programs.universityName,
      college: programs.college,
      degree: programs.degree,
      department: programs.department,
      ingestionStatus: programs.ingestionStatus,
      lastScrapedAt: programs.lastScrapedAt,
      createdAt: programs.createdAt,
      metadata: programs.metadata,
      errorMessage: programs.errorMessage,
    })
    .from(programs)
    .where(eq(programs.slug, slug))
    .limit(1)

  return results[0] ?? null
}

/**
 * Returns a single program by ID.
 * Used internally and for status polling.
 */
export async function getProgramById(programId: string): Promise<ProgramDetail | null> {
  const results = await db
    .select({
      id: programs.id,
      slug: programs.slug,
      sourceUrl: programs.sourceUrl,
      programName: programs.programName,
      universityName: programs.universityName,
      college: programs.college,
      degree: programs.degree,
      department: programs.department,
      ingestionStatus: programs.ingestionStatus,
      lastScrapedAt: programs.lastScrapedAt,
      createdAt: programs.createdAt,
      metadata: programs.metadata,
      errorMessage: programs.errorMessage,
    })
    .from(programs)
    .where(eq(programs.id, programId))
    .limit(1)

  return results[0] ?? null
}

/**
 * Deletes a program by slug. Cascade handles chunks automatically.
 * Returns true if deleted, false if not found.
 */
export async function deleteProgramBySlug(slug: string): Promise<boolean> {
  const deleted = await db
    .delete(programs)
    .where(eq(programs.slug, slug))
    .returning({ id: programs.id })

  return deleted.length > 0
}
