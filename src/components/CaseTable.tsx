import { Play, Square, Check } from 'lucide-react';
import type { TestCase } from '../../shared/testPlan.js';
import type { RunReport } from '../../shared/runTypes.js';
import type { CaseOverride } from '../../hooks/useRunnerStore.js';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

export default function CaseTable({
  cases,
  selectedIds,
  activeCaseId,
  onToggleSelect,
  onSelectMany,
  onOpen,
  onRunSingle,
  isRunning,
  runningCaseId,
  report,
  filterText,
  overrides,
}: {
  cases: TestCase[];
  selectedIds: Record<string, boolean>;
  activeCaseId?: string | null;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
  onOpen: (id: string) => void;
  onRunSingle: (id: string) => void;
  isRunning: boolean;
  runningCaseId?: string | null;
  report: RunReport | null;
  filterText: string;
  overrides?: Record<string, CaseOverride>;
}) {
  const lowered = filterText.trim().toLowerCase();
  const filtered = lowered
    ? cases.filter((c) => {
        const override = overrides?.[c.id];
        const searchText = `${c.id} ${c.title} ${c.group ?? ''} ${override?.path ?? c.path}`.toLowerCase();
        return searchText.includes(lowered);
      })
    : cases;

  const ids = filtered.map((c) => c.id);
  const selectedCount = ids.filter((id) => selectedIds[id]).length;
  const allSelected = ids.length > 0 && selectedCount === ids.length;

  const resultMap = new Map(report?.results.map((r) => [r.caseId, r] as const) ?? []);

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-zinc-600 bg-zinc-900">
      <div className="shrink-0 flex items-center justify-between gap-3 border-b border-zinc-600 px-4 py-3 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-300">显示 {filtered.length} 条</div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
              <Check className="h-3 w-3" />
              已选 {selectedCount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            className={cn(
              'rounded-lg border border-zinc-700 bg-zinc-950/40 px-2.5 py-1.5 text-zinc-200 transition hover:bg-zinc-800/60',
              isRunning && 'pointer-events-none opacity-60',
            )}
            onClick={() => onSelectMany(ids, !allSelected)}
          >
            {allSelected ? '取消全选' : '全选'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-600">
            <tr className="text-left text-xs text-zinc-400">
              <th className="w-10 px-4 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  checked={allSelected}
                  onChange={() => onSelectMany(ids, !allSelected)}
                />
              </th>
              <th className="w-32 px-2 py-2">用例ID</th>
              <th className="px-2 py-2">描述</th>
              <th className="w-20 px-2 py-2">方法</th>
              <th className="px-2 py-2">路径</th>
              <th className="w-20 px-2 py-2">状态</th>
              <th className="w-48 px-2 py-2">预期结果</th>
              <th className="w-20 px-2 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((c) => {
              const r = resultMap.get(c.id);
              const status = r?.status;
              const isActive = activeCaseId === c.id;
              const isSelected = !!selectedIds[c.id];
              const isCurrentlyRunning = runningCaseId === c.id;

              return (
                <tr
                  key={c.id}
                  className={cn(
                    'border-t border-zinc-700 transition-all duration-150',
                    isActive && !isSelected && 'bg-indigo-500/10',
                    isSelected && 'bg-indigo-500/20',
                    !isActive && !isSelected && 'hover:bg-zinc-700/30',
                    isCurrentlyRunning && 'bg-emerald-500/10',
                  )}
                  onClick={() => onOpen(c.id)}
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      checked={isSelected}
                      onChange={() => onToggleSelect(c.id)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className={cn(
                      "font-mono text-xs transition-colors",
                      isActive ? "text-indigo-300 font-medium" : "text-zinc-200"
                    )}>
                      {c.id}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className={cn(
                      "break-words text-xs transition-colors",
                      isActive ? "text-indigo-100" : "text-zinc-200"
                    )}>
                      {c.title || '-'}
                    </div>
                    <div className="break-words text-xs text-zinc-500">{c.group || '-'}</div>
                  </td>
                  <td className="px-2 py-2">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-xs transition-colors",
                      c.method === 'GET' && "bg-emerald-500/20 text-emerald-300",
                      c.method === 'POST' && "bg-blue-500/20 text-blue-300",
                      c.method === 'PUT' && "bg-amber-500/20 text-amber-300",
                      c.method === 'DELETE' && "bg-rose-500/20 text-rose-300",
                      ['PATCH', 'HEAD', 'OPTIONS'].includes(c.method) && "bg-zinc-500/20 text-zinc-300",
                    )}>
                      {c.method}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="font-mono text-xs text-zinc-400 transition-colors">{overrides?.[c.id]?.path ?? c.path}</div>
                  </td>
                  <td className="px-2 py-2">
                    {status ? (
                      <StatusBadge status={status} />
                    ) : (
                      <span className="text-xs text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="max-w-48 truncate text-xs text-zinc-400" title={overrides?.[c.id]?.expectedResult ?? c.expectedResult ?? '-'}>
                      {overrides?.[c.id]?.expectedResult ?? c.expectedResult ?? '-'}
                    </div>
                  </td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-all',
                        isCurrentlyRunning
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-800/60',
                        isRunning && !isCurrentlyRunning && 'pointer-events-none opacity-50',
                      )}
                      onClick={() => onRunSingle(c.id)}
                      disabled={isRunning && !isCurrentlyRunning}
                    >
                      {isCurrentlyRunning ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
                          运行中
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          运行
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
