import { startIngestion } from '@/lib/services/ingest-service'

export async function POST(request: Request) {
  // 1. Parse and validate
  let url: string
  try {
    const body = await request.json()
    url = body.url?.trim()
    if (!url) throw new Error('Missing URL')
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must be http or https')
    }
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    )
  }

  // 2. Delegate to service
  const result = await startIngestion(url)

  // 3. Respond
  const statusCode = result.status === 'created' ? 201 : 200
  return Response.json({ programId: result.programId }, { status: statusCode })
}
