import { getAllPrograms } from '@/lib/services/program-service'
import { getProgramsForCompare, generateCompareSummary } from '@/lib/services/compare-service'

/** GET /api/compare — returns all ready programs for the selector */
export async function GET() {
  const programs = await getAllPrograms()
  const ready = programs.filter((p) => p.ingestionStatus === 'done')
  return Response.json(ready)
}

/** POST /api/compare — returns comparison data + AI summary for selected slugs */
export async function POST(request: Request) {
  const { slugs } = await request.json()

  if (!Array.isArray(slugs) || slugs.length < 2) {
    return Response.json({ error: 'Select at least 2 programs to compare' }, { status: 400 })
  }
  if (slugs.length > 3) {
    return Response.json({ error: 'Compare up to 3 programs at a time' }, { status: 400 })
  }

  const programs = await getProgramsForCompare(slugs)
  if (programs.length < 2) {
    return Response.json({ error: 'Not enough ready programs found' }, { status: 400 })
  }

  const summary = await generateCompareSummary(programs)
  return Response.json({ programs, summary })
}
