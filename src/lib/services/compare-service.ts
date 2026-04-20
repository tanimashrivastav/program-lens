import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { getProgramBySlug } from './program-service'
import type { ProgramMetadata } from './extraction-service'

export type ProgramCompareData = {
  id: string
  slug: string
  programName: string | null
  universityName: string | null
  college: string | null
  degree: string | null
  metadata: ProgramMetadata | null
}

/**
 * Fetches full data for a list of slugs ready for side-by-side comparison.
 */
export async function getProgramsForCompare(slugs: string[]): Promise<ProgramCompareData[]> {
  const results = await Promise.all(slugs.map((s) => getProgramBySlug(s)))
  return results
    .filter((p) => p !== null && p.ingestionStatus === 'done')
    .map((p) => ({
      id: p!.id,
      slug: p!.slug!,
      programName: p!.programName,
      universityName: p!.universityName,
      college: p!.college,
      degree: p!.degree,
      metadata: (p!.metadata as ProgramMetadata | null),
    }))
}

/**
 * Asks Claude to produce a concise tradeoff summary across the selected programs.
 */
export async function generateCompareSummary(programs: ProgramCompareData[]): Promise<string> {
  const summaries = programs.map((p) => {
    const m = p.metadata
    const lines = [
      `Program: ${p.programName ?? 'Unknown'} — ${p.universityName ?? 'Unknown'}`,
      m?.degree ? `Degree: ${m.degree}` : null,
      m?.duration ? `Duration: ${m.duration}` : null,
      m?.location ? `Location: ${m.location}` : null,
      m?.annualTuitionResident ? `Tuition (resident): ${m.annualTuitionResident}` : null,
      m?.annualTuitionNonResident ? `Tuition (non-resident): ${m.annualTuitionNonResident}` : null,
      m?.averageStartingSalary ? `Avg. starting salary: ${m.averageStartingSalary}` : null,
      m?.applicationDeadlines?.length
        ? `Deadlines: ${m.applicationDeadlines.join(', ')}`
        : null,
      m?.topEmployers?.length
        ? `Top employers: ${m.topEmployers.slice(0, 5).join(', ')}`
        : null,
    ].filter(Boolean)
    return lines.join('\n')
  })

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5'),
    prompt: `You are helping a student compare graduate programs. Based on the data below, write a concise comparison (4-6 sentences) highlighting the key tradeoffs between these programs — cost, location, career outcomes, and any other notable differences. Be direct and useful.

${summaries.join('\n\n---\n\n')}`,
    maxOutputTokens: 400,
  })

  return text
}
