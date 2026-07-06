import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';

export default async function ReceptionLayout({ children }: { children: ReactNode }) {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'RECEPTION') redirect('/lab');
  return <>{children}</>;
}