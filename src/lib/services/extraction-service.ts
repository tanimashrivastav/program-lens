import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

// ---- Schema ----

/**
 * Core fields extracted from every program.
 * Kept intentionally small — complex schemas cause Anthropic grammar timeouts.
 * Extended data lives in the raw metadata jsonb field.
 */
const ProgramMetadataSchema = z.object({
  programName: z.string(),
  universityName: z.string(),
  degree: z.string(),
  college: z.string().optional(),
  department: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  annualTuitionResident: z.string().optional(),
  annualTuitionNonResident: z.string().optional(),
  averageStartingSalary: z.string().optional(),
  applicationDeadlines: z.array(z.string()).optional(),
  topEmployers: z.array(z.string()).optional(),
})

export type ProgramMetadata = z.infer<typeof ProgramMetadataSchema>

// ---- Service ----

/**
 * Uses Claude to extract structured metadata from raw scraped program text.
 * Returns null if extraction fails — ingestion continues without metadata.
 */
export async function extractProgramMetadata(
  rawText: string,
  sourceUrl: string
): Promise<ProgramMetadata | null> {
  try {
    // Trim to first 15k chars — key program info is usually at the top
    const trimmedText = rawText.slice(0, 15_000)

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: ProgramMetadataSchema,
      prompt: `Extract structured information about this graduate program from the text below.
Only include information explicitly stated in the text. Do not infer or guess.
Source URL: ${sourceUrl}

--- PROGRAM TEXT ---
${trimmedText}
--- END TEXT ---`,
    })

    return object
  } catch (err) {
    console.error('[extraction-service] failed to extract metadata:', err)
    return null
  }
}
