import { getProgramBySlug, deleteProgramBySlug } from '@/lib/services/program-service'

export async function GET(_req: Request, ctx: RouteContext<'/api/programs/[slug]'>) {
  const { slug } = await ctx.params

  const program = await getProgramBySlug(slug)

  if (!program) {
    return Response.json({ error: 'Program not found' }, { status: 404 })
  }

  return Response.json(program)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/programs/[slug]'>) {
  const { slug } = await ctx.params

  const deleted = await deleteProgramBySlug(slug)

  if (!deleted) {
    return Response.json({ error: 'Program not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
