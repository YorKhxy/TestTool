import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  Globe,
  Play,
  PlayCircle,
  Settings,
  TerminalSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaywrightStore } from '@/hooks/usePlaywrightStore';

type Mode = 'http' | 'playwright';

export default function AppShellClean({ children }: { children: ReactNode }) {
  const location = useLocation();
  const mode: Mode = location.pathname.startsWith('/playwright') ? 'playwright' : 'http';
  const loadSettings = usePlaywrightStore((s) => s.loadSettings);

  useEffect(() => {
    if (mode === 'playwright') {
      void loadSettings();
    }
  }, [mode, loadSettings]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex h-screen gap-4 px-4 py-4">
        <aside className="w-60 shrink-0">
          <div className="sticky top-0 flex h-full flex-col rounded-xl border border-zinc-600 bg-zinc-900 p-3">
            <div className="px-2 py-2 text-sm font-semibold text-zinc-100">用例执行工具</div>

            <div className="mt-3 px-2">
              <div className="mb-2 text-xs font-medium text-zinc-500">执行模式</div>
              <div className="flex flex-col gap-1">
                <ModeButton icon={<Globe className="h-4 w-4" />} label="HTTP" active={mode === 'http'} to="/" />
                <ModeButton
                  icon={<Play className="h-4 w-4" />}
                  label="Playwright"
                  active={mode === 'playwright'}
                  to="/playwright"
                />
              </div>
            </div>

            <div className="my-3 border-t border-zinc-700" />

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {mode === 'http' && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500">HTTP 模式</div>
                  <NavItem to="/" icon={<ClipboardList className="h-4 w-4" />} label="工作台" />
                  <NavItem to="/reports" icon={<FileText className="h-4 w-4" />} label="执行报告" />
                  <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label="运行设置" />
                </>
              )}
              {mode === 'playwright' && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500">Playwright 模式</div>
                  <NavItem to="/playwright" icon={<PlayCircle className="h-4 w-4" />} label="工作台" end />
                  <NavItem to="/playwright/native" icon={<TerminalSquare className="h-4 w-4" />} label="原生 Spec" />
                  <NavItem to="/playwright/settings" icon={<Settings className="h-4 w-4" />} label="浏览器设置" />
                  <NavItem to="/playwright/reports" icon={<FileText className="h-4 w-4" />} label="执行报告" />
                </>
              )}
            </nav>

            <div className="mt-2 border-t border-zinc-700 px-2 pt-2">
              <div className="text-xs text-zinc-500">v1.0.0</div>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

function ModeButton({ icon, label, active, to }: { icon: ReactNode; label: string; active: boolean; to: string }) {
  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
        active
          ? 'border-indigo-500/30 bg-indigo-500/20 text-indigo-300'
          : 'border-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
    </NavLink>
  );
}

function NavItem({ to, icon, label, end }: { to: string; icon: ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/60 hover:text-zinc-50',
          isActive && 'bg-zinc-800/80 text-zinc-50',
        )
      }
      end={end ?? to === '/'}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
