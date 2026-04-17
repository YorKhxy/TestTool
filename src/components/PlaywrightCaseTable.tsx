import { useState, useCallback, useMemo } from 'react';
import { Play, Check, ArrowUp, ArrowDown } from 'lucide-react';
import type { PlaywrightCase } from '../../shared/playwrightCase';
import { cn } from '@/lib/utils';

type ExecutionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'canceled';

interface PlaywrightCaseTableProps {
  cases: PlaywrightCase[];
  executionQueue: string[];
  selectedIds: Record<string, boolean>;
  activeCaseId: string | null;
  caseStatuses: Record<string, ExecutionStatus>;
  isExecuting: boolean;
  executingCaseId: string | null;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpen: (id: string) => void;
  onRunSingle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragReorder: (fromIndex: number, toIndex: number) => void;
}

function PriorityBadge({ priority }: { priority?: string }) {
  const colors: Record<string, string> = {
    P0: 'bg-red-500/20 text-red-300',
    P1: 'bg-orange-500/20 text-orange-300',
    P2: 'bg-yellow-500/20 text-yellow-300',
    P3: 'bg-green-500/20 text-green-300',
  };
  const color = colors[priority || 'P1'] || colors.P1;
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', color)}>
      {priority || 'P1'}
    </span>
  );
}

function StatusIcon({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case 'passed':
      return <span className="text-emerald-400">✅</span>;
    case 'failed':
      return <span className="text-red-400">❌</span>;
    case 'running':
      return <span className="text-blue-400 animate-pulse">🔄</span>;
    case 'skipped':
      return <span className="text-zinc-400">⏭️</span>;
    default:
      return <span className="text-zinc-500">-</span>;
  }
}

export default function PlaywrightCaseTable({
  cases,
  executionQueue,
  selectedIds,
  activeCaseId,
  caseStatuses,
  isExecuting,
  executingCaseId,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onOpen,
  onRunSingle,
  onMoveUp,
  onMoveDown,
  onDragReorder,
}: PlaywrightCaseTableProps) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const queueIndexMap = useMemo(() => new Map(executionQueue.map((id, idx) => [id, idx])), [executionQueue]);
  const sortedCases = useMemo(() => [...cases].sort((a, b) => {
    const idxA = queueIndexMap.get(a.id) ?? cases.indexOf(a);
    const idxB = queueIndexMap.get(b.id) ?? cases.indexOf(b);
    return idxA - idxB;
  }), [cases, queueIndexMap]);

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const allSelected = cases.length > 0 && selectedCount === cases.length;

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    if (isExecuting) {
      e.preventDefault();
      return;
    }
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    const dragGhost = document.createElement('div');
    dragGhost.style.opacity = '0';
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 0, 0);
    setTimeout(() => document.body.removeChild(dragGhost), 0);
  }, [isExecuting]);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setOverIdx(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    e.stopPropagation();

    const dragIdxStr = e.dataTransfer.getData('text/plain');
    const dragIdx = parseInt(dragIdxStr, 10);

    if (!isNaN(dragIdx) && dragIdx !== dropIdx && dragIdx >= 0 && dropIdx >= 0) {
      const dragCaseId = sortedCases[dragIdx]?.id;
      const dropCaseId = sortedCases[dropIdx]?.id;
      if (dragCaseId && dropCaseId) {
        const fromQueueIdx = executionQueue.indexOf(dragCaseId);
        const toQueueIdx = executionQueue.indexOf(dropCaseId);
        if (fromQueueIdx !== -1 && toQueueIdx !== -1) {
          onDragReorder(fromQueueIdx, toQueueIdx);
        }
      }
    }

    setDraggingIdx(null);
    setOverIdx(null);
  }, [sortedCases, executionQueue, onDragReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggingIdx(null);
    setOverIdx(null);
  }, []);

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-zinc-600 bg-zinc-900">
      <div className="shrink-0 flex items-center justify-between gap-3 border-b border-zinc-600 px-4 py-3 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-300">显示 {cases.length} 条</div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
              <Check className="h-3 w-3" />
              已选 {selectedCount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs text-zinc-500">拖动行可调整顺序</span>
          <button
            className={cn(
              'rounded-lg border border-zinc-700 bg-zinc-950/40 px-2.5 py-1.5 text-zinc-200 transition hover:bg-zinc-800/60',
              isExecuting && 'pointer-events-none opacity-60',
            )}
            onClick={() => (allSelected ? onDeselectAll() : onSelectAll())}
          >
            {allSelected ? '取消全选' : '全选'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-600">
            <tr className="text-left text-xs text-zinc-400">
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  checked={allSelected}
                  onChange={() => (allSelected ? onDeselectAll() : onSelectAll())}
                />
              </th>
              <th className="w-16 px-2 py-3 text-center">序号</th>
              <th className="w-28 px-2 py-3">用例ID</th>
              <th className="w-16 px-2 py-3">优先级</th>
              <th className="px-2 py-3">用例标题</th>
              <th className="w-16 px-2 py-3">状态</th>
              <th className="w-16 px-2 py-3">步骤</th>
              <th className="w-28 px-2 py-3 text-center">排序</th>
              <th className="w-20 px-2 py-3">操作</th>
            </tr>
          </thead>
          <tbody
            className="text-sm"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDraggingIdx(null);
              setOverIdx(null);
            }}
          >
            {sortedCases.map((c, displayIdx) => {
              const status = caseStatuses[c.id] || 'pending';
              const isActive = activeCaseId === c.id;
              const isSelected = !!selectedIds[c.id];
              const isCurrentlyRunning = executingCaseId === c.id;
              const queueIdx = queueIndexMap.get(c.id) ?? -1;
              const isDragging = draggingIdx === displayIdx;
              const isOver = overIdx === displayIdx;

              return (
                <tr
                  key={c.id}
                  draggable={!isExecuting}
                  onDragStart={(e) => handleDragStart(e, displayIdx)}
                  onDragOver={(e) => handleDragOver(e, displayIdx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, displayIdx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'border-t border-zinc-700 transition-all duration-150 select-none',
                    isDragging && 'opacity-40 bg-zinc-800',
                    isOver && !isDragging && 'bg-indigo-500/20 ring-2 ring-inset ring-indigo-500',
                    !isExecuting && !isDragging && 'cursor-grab active:cursor-grabbing',
                    isExecuting && 'cursor-not-allowed',
                    isActive && !isSelected && !isDragging && 'bg-indigo-500/10',
                    isSelected && !isDragging && 'bg-indigo-500/20',
                    !isActive && !isSelected && !isDragging && 'hover:bg-zinc-700/30',
                    isCurrentlyRunning && 'bg-emerald-500/10',
                  )}
                  onClick={() => onOpen(c.id)}
                >
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      checked={isSelected}
                      onChange={() => onToggleSelect(c.id)}
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-700 text-xs font-mono text-zinc-300">
                      {queueIdx + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div
                      className={cn(
                        'font-mono text-xs transition-colors truncate',
                        isActive ? 'text-indigo-300 font-medium' : 'text-zinc-200',
                      )}
                      title={c.id}
                    >
                      {c.id}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-2 py-3">
                    <div
                      className={cn(
                        'break-words text-xs transition-colors',
                        isActive ? 'text-indigo-100' : 'text-zinc-200',
                      )}
                    >
                      {c.title || '-'}
                    </div>
                    <div className="break-words text-xs text-zinc-500">{c.group || '-'}</div>
                  </td>
                  <td className="px-2 py-3">
                    <StatusIcon status={status} />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-xs text-zinc-400">{c.steps?.length || 0}</span>
                  </td>
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={cn(
                          'flex items-center justify-center w-7 h-7 rounded-lg border transition-all',
                          queueIdx > 0 && !isExecuting
                            ? 'border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-600 cursor-not-allowed',
                        )}
                        onClick={() => queueIdx > 0 && onMoveUp(c.id)}
                        disabled={queueIdx <= 0 || isExecuting}
                        title="上移"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        className={cn(
                          'flex items-center justify-center w-7 h-7 rounded-lg border transition-all',
                          queueIdx < executionQueue.length - 1 && !isExecuting
                            ? 'border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white'
                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-600 cursor-not-allowed',
                        )}
                        onClick={() => queueIdx < executionQueue.length - 1 && onMoveDown(c.id)}
                        disabled={queueIdx >= executionQueue.length - 1 || isExecuting}
                        title="下移"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={cn(
                        'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all w-full',
                        isCurrentlyRunning
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700',
                        isExecuting && 'pointer-events-none opacity-50',
                      )}
                      onClick={() => onRunSingle(c.id)}
                      disabled={isExecuting}
                    >
                      {isCurrentlyRunning ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
                          运行
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
