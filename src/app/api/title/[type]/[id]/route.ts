import { NextResponse } from 'next/server';
import { detail, enrich } from '@/lib/providers/tmdb';
import { safeForGeneral } from '@/lib/recommendations/rank';
import { failure } from '@/lib/api';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const { type, id } = await params;
    if (!['movie', 'tv'].includes(type) || !/^\d+$/.test(id))
      return NextResponse.json({ error: 'Title not found.' }, { status: 404 });
    const m = await detail(type as 'movie' | 'tv', +id, true);
    const mature = new URL(req.url).searchParams.get('mature') === 'true';
    m.related = (await enrich((m.related || []).slice(0, 6))).filter(
      (m) => mature || safeForGeneral(m),
    );
    m.similar = (await enrich((m.similar || []).slice(0, 6))).filter(
      (m) => mature || safeForGeneral(m),
    );
    return NextResponse.json(m);
  } catch (e) {
    return failure(e);
  }
}
