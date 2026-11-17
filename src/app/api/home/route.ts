import { NextResponse } from 'next/server';
import { homeData } from '@/lib/home';
import { failure, preferences } from '@/lib/api';
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    return NextResponse.json(
      await homeData(new URL(req.url).searchParams.get('mature') === 'true'),
    );
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 30000)
      return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
    const body = JSON.parse(text);
    const p = preferences(body.preferences);
    const keys = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((v) => typeof v === 'string' && /^(movie|tv):\d+$/.test(v)).slice(0, 300)
        : [];
    return NextResponse.json(
      await homeData(p.allowMature, p, keys(body.recent), keys(body.weekly)),
    );
  } catch (error) {
    return failure(error);
  }
}
