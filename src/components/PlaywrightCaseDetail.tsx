import { X, Play, Trash2 } from 'lucide-react';
import type { PlaywrightCase } from '../../shared/playwrightCase';
import { cn } from '@/lib/utils';

interface CaseDetailPanelProps {
  caseData: PlaywrightCase | null;
  isOpen: boolean;
  onClose: () => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  isExecuting: boolean;
}

function StepTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    navigate: '🌐',
    click: '👆',
    fill: '✏️',
    select: '📋',
    wait: '⏱️',
    waitForSelector: '👀',
    assert: '✅',
    screenshot: '📷',
    evaluate: '⚡',
    api: '🔗',
    extract: '📤',
  };
  return <span className="text-sm">{icons[type] || '❓'}</span>;
}

function PriorityBadge({ priority }: { priority?: string }) {
  const colors: Record<string, string> = {
    P0: 'bg-red-500/20 text-red-300 border-red-500/30',
    P1: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    P2: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    P3: 'bg-green-500/20 text-green-300 border-green-500/30',
  };
  const color = colors[priority || 'P1'] || colors.P1;
  return (
    <span className={cn('rounded px-2 py-0.5 text-xs font-medium border', color)}>
      {priority || 'P1'}
    </span>
  );
}

export default function CaseDetailPanel({
  caseData,
  isOpen,
  onClose,
  onRun,
  onDelete,
  isExecuting,
}: CaseDetailPanelProps) {
  if (!isOpen || !caseData) return null;

  return (
    <div className="h-full flex flex-col rounded-xl border-2 border-zinc-600 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-600 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-100">用例详情</h3>
          <PriorityBadge priority={caseData.priority} />
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">用例ID</div>
            <div className="font-mono text-sm text-zinc-200 truncate" title={caseData.id}>{caseData.id}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">用例标题</div>
            <div className="text-sm text-zinc-200">{caseData.title}</div>
          </div>
        </div>

        {caseData.group && (
          <div className="space-y-1">
            <div className="text-xs text-zinc-500">分组</div>
            <div className="text-sm text-zinc-200">{caseData.group}</div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">执行步骤</div>
            <div className="text-xs text-zinc-400">{caseData.steps?.length || 0} 步</div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 overflow-hidden">
            {caseData.steps && caseData.steps.length > 0 ? (
              <div className="divide-y divide-zinc-700">
                {caseData.steps.map((step, index) => (
                  <div key={step.id || index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-700 text-xs text-zinc-300 font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <StepTypeIcon type={step.type} />
                          <div className="text-sm font-medium text-zinc-200">
                            {step.type}
                            {step.description && <span className="text-zinc-400 font-normal ml-2">{step.description}</span>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pl-8">
                          {step.selector && (
                            <div className="space-y-0.5">
                              <div className="text-xs text-zinc-500">选择器</div>
                              <div className="text-xs text-zinc-300 font-mono break-all" title={step.selector}>
                                {step.selector}
                              </div>
                            </div>
                          )}
                          {step.value && (
                            <div className="space-y-0.5">
                              <div className="text-xs text-zinc-500">值</div>
                              <div className="text-xs text-zinc-300 font-mono break-all" title={step.value}>
                                {step.value}
                              </div>
                            </div>
                          )}
                        </div>
                        {step.options?.expected && (
                          <div className="pl-8 text-xs text-zinc-500">
                            预期: <span className="text-zinc-300">{step.options.expected}</span>
                            <span className="text-zinc-600 ml-1">({step.options.operator || 'contains'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-zinc-500">暂无步骤数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-600 px-4 py-3">
        <button
          onClick={() => onDelete(caseData.id)}
          disabled={isExecuting}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition',
            !isExecuting ? 'hover:bg-red-500/20' : 'opacity-50 cursor-not-allowed',
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          删除
        </button>
        <button
          onClick={() => onRun(caseData.id)}
          disabled={isExecuting}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition',
            !isExecuting ? 'hover:bg-emerald-400' : 'opacity-50 cursor-not-allowed',
          )}
        >
          <Play className="h-3.5 w-3.5" />
          执行此用例
        </button>
      </div>
    </div>
  );
}
