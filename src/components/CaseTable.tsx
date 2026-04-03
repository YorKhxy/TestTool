import { Play, Square } from 'lucide-react';
import type { TestCase } from '../../shared/testPlan.js';
import type { RunReport } from '../../shared/runTypes.js';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

export default function CaseTable({
  cases,
  selectedIds,
  onToggleSelect,
  onSelectMany,
  onOpen,
  onRunSingle,
  isRunning,
  report,
  filterText,
}: {
  cases: TestCase[];
  selectedIds: Record<string, boolean>;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[], selected: boolean) => void;
  onOpen: (id: string) => void;
  onRunSingle: (id: string) => void;
  isRunning: boolean;
  report: RunReport | null;
  filterText: string;
}) {
  const lowered = filterText.trim().toLowerCase();
  const filtered = lowered
    ? cases.filter((c) => `${c.id} ${c.title} ${c.group ?? ''} ${c.path}`.toLowerCase().includes(lowered))
    : cases;

  const ids = filtered.map((c) => c.id);
  const selectedCount = ids.filter((id) => selectedIds[id]).length;
  const allSelected = ids.length > 0 && selectedCount === ids.length;

  const resultMap = new Map(report?.results.map((r) => [r.caseId, r] as const) ?? []);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="text-sm text-zinc-300">显示 {filtered.length} 条</div>
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
          <div className="text-zinc-500">已选 {selectedCount}</div>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 bg-zinc-900/70 backdrop-blur">
            <tr className="text-left text-xs text-zinc-400">
              <th className="w-10 px-4 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onSelectMany(ids, !allSelected)}
                />
              </th>
              <th className="w-32 px-2 py-2">用例ID</th>
              <th className="px-2 py-2">描述</th>
              <th className="w-24 px-2 py-2">方法</th>
              <th className="w-72 px-2 py-2">路径</th>
              <th className="w-20 px-2 py-2">状态</th>
              <th className="w-20 px-2 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((c) => {
              const r = resultMap.get(c.id);
              const status = r?.status;
              return (
                <tr
                  key={c.id}
                  className="border-t border-zinc-800/70 hover:bg-zinc-800/30"
                  onClick={() => onOpen(c.id)}
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={!!selectedIds[c.id]}
                      onChange={() => onToggleSelect(c.id)}
                    />
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-zinc-200">{c.id}</td>
                  <td className="px-2 py-2 text-zinc-200">
                    <div className="truncate">{c.title || '-'}</div>
                    <div className="truncate text-xs text-zinc-500">{c.group || '-'}</div>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-zinc-300">{c.method}</td>
                  <td className="px-2 py-2 font-mono text-xs text-zinc-400">
                    <div className="truncate">{c.path}</div>
                  </td>
                  <td className="px-2 py-2">{status ? <StatusBadge status={status} /> : <span className="text-xs text-zinc-500">-</span>}</td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-200 transition hover:bg-zinc-800/60',
                        isRunning && 'pointer-events-none opacity-60',
                      )}
                      onClick={() => onRunSingle(c.id)}
                    >
                      {isRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      运行
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

