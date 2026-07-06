import { NextResponse } from 'next/server';
import { readSession } from '@/server/auth/session';

export async function GET() {
  const u = await readSession();
  if (!u) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: u.sub, username: u.username, name: u.name, role: u.role } });
}
