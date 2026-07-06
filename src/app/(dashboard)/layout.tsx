import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { Nav } from '@/components/layout/nav';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const u = await readSession();
  if (!u) redirect('/login');
  return (
    <div className="min-h-screen">
      <Nav user={{ name: u.name, username: u.username, role: u.role }} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}