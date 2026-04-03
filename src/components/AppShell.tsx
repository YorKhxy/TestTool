import { NavLink } from 'react-router-dom';
import { ClipboardList, FileText, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex h-screen gap-6 px-6 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-0 rounded-xl border border-zinc-600 bg-zinc-900 p-3">
            <div className="px-2 py-2 text-sm font-semibold text-zinc-100">用例执行工具</div>
            <nav className="mt-2 flex flex-col gap-1">
              <NavItem to="/" icon={<ClipboardList className="h-4 w-4" />} label="工作台" />
              <NavItem to="/reports" icon={<FileText className="h-4 w-4" />} label="执行报告" />
              <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="运行设置" />
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/60 hover:text-zinc-50',
          isActive && 'bg-zinc-800/80 text-zinc-50',
        )
      }
      end={to === '/'}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
