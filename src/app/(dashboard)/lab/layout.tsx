import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';

export default async function LabLayout({ children }: { children: ReactNode }) {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'LAB') redirect('/reception');
  return <>{children}</>;
}