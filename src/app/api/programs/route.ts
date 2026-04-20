import { getAllPrograms } from '@/lib/services/program-service'

export async function GET() {
  const programs = await getAllPrograms()
  return Response.json(programs)
}
