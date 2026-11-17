import { NextResponse } from 'next/server';
import { searchCatalogue } from '@/lib/catalogue';
import { failure, filters } from '@/lib/api';
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const query = (params.get('q') || '').trim().slice(0, 150);
    const page = Math.max(1, Math.min(500, Math.floor(Number(params.get('page')) || 1)));
    const person = params.get('person');
    return NextResponse.json(
      await searchCatalogue(
        query,
        filters(params),
        page,
        person && /^\d+$/.test(person) ? Number(person) : undefined,
        params.get('safe') === 'true',
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
