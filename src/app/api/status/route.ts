import { NextResponse } from 'next/server';
import { configured } from '@/lib/providers/tmdb';
export async function GET() {
  return NextResponse.json({ configured: configured(), provider: 'TMDB' });
}
