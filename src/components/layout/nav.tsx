'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@/types/domain';

type NavLink = { href: string; label: string; roles: Role[] };

const links: NavLink[] = [
  // Each role has a dedicated landing page.
  { href: '/admin', label: 'Admin', roles: ['ADMIN'] },
  { href: '/reception', label: 'Reception', roles: ['RECEPTION'] },
  { href: '/lab', label: 'Lab', roles: ['LAB'] },
  // Shared modules — admin always has read access.
  { href: '/patients', label: 'Patients', roles: ['ADMIN', 'RECEPTION'] },
  { href: '/invoices', label: 'Invoices', roles: ['ADMIN', 'RECEPTION'] },
  { href: '/tests', label: 'Tests', roles: ['ADMIN'] },
];

export function Nav({ user }: { user: { name: string; username: string; role: Role } }) {
  const pathname = usePathname();
  const router = useRouter();
  const visible = links.filter((l) => l.roles.includes(user.role));

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Sachar Medical
          </Link>
          <nav className="hidden gap-1 md:flex">
            {visible.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs leading-tight">
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-slate-500">
              {user.role} · {user.username}
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {visible.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/');
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                active ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}