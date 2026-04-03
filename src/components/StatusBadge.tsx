import { cn } from '@/lib/utils';
import type { CaseResultStatus } from '../../shared/runTypes.js';

const map: Record<CaseResultStatus, string> = {
  passed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  failed: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  running: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  skipped: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30',
  canceled: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
};

export default function StatusBadge({ status }: { status: CaseResultStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        map[status],
      )}
    >
      {status}
    </span>
  );
}

