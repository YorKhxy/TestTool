import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FileUp, Play, Trash2, GripVertical } from 'lucide-react';
import CaseDetailPanel from '@/components/CaseDetailPanel';
import CaseTable from '@/components/CaseTable';
import { useRunnerStore } from '@/hooks/useRunnerStore';
import { cn } from '@/lib/utils';

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState('');
  const [leftWidth, setLeftWidth] = useState(65);
  const [isDragging, setIsDragging] = useState(false);
  const [showWidthIndicator, setShowWidthIndicator] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isDragging: false });

  const {
    fileName,
    parsed,
    selectedIds,
    overrides,
    settings,
    activeCaseId,
    isRunning,
    lastReport,
    error,
    loadSettings,
    importMarkdown,
    setActiveCase,
    toggleSelect,
    setSelectMany,
    clearSelection,
    updateOverride,
    runSelected,
    runSingle,
  } = useRunnerStore();

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStateRef.current.isDragging = true;
    setIsDragging(true);
    setShowWidthIndicator(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleDoubleClick = useCallback(() => {
    setLeftWidth(65);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(30, Math.min(80, newWidth)));
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
        setShowWidthIndicator(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const activeCase = useMemo(() => parsed?.cases.find((c) => c.id === activeCaseId) ?? null, [parsed, activeCaseId]);
  const activeOverride = useMemo(() => {
    if (!activeCase) return null;
    const o = overrides[activeCase.id];
    if (o) return o;
    return {
      headersText: activeCase.headersRaw ?? '{}',
      queryText: activeCase.queryRaw ?? '{}',
      bodyText: activeCase.bodyRaw ?? '',
    };
  }, [activeCase, overrides]);

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds],
  );

  const summary = lastReport?.summary;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">工作台</div>
            <div className="mt-1 text-xs text-zinc-400">导入 Markdown 测试用例文档，选择单条或批量执行</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const text = await f.text();
                await importMarkdown(f.name, text);
                e.target.value = '';
              }}
            />
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400',
                isRunning && 'pointer-events-none opacity-60',
              )}
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              导入Markdown
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700',
                (!parsed || selectedCount === 0 || isRunning) && 'pointer-events-none opacity-50',
              )}
              onClick={() => void runSelected()}
            >
              <Play className="h-4 w-4" />
              批量执行（{selectedCount}）
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700',
                (selectedCount === 0 || isRunning) && 'pointer-events-none opacity-50',
              )}
              onClick={() => clearSelection()}
            >
              <Trash2 className="h-4 w-4" />
              清空选择
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard label="当前文件" value={fileName ?? '未导入'} />
            <InfoCard label="Base URL" value={settings.baseUrl || '未配置'} mono />
            <InfoCard
              label="最近一次执行"
              value={summary ? `${summary.passed}/${summary.total} 通过，${summary.failed} 失败` : '暂无'}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700 md:max-w-md"
            placeholder="搜索：用例ID / 描述 / 分组 / 路径"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {error ? <div className="text-sm text-rose-300">{error}</div> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-1 gap-1 overflow-hidden" ref={containerRef}>
        <div className="h-full overflow-hidden" style={{ width: `${leftWidth}%` }}>
          {parsed ? (
            <CaseTable
              cases={parsed.cases}
              selectedIds={selectedIds}
              activeCaseId={activeCaseId}
              onToggleSelect={toggleSelect}
              onSelectMany={setSelectMany}
              onOpen={setActiveCase}
              onRunSingle={(id) => void runSingle(id)}
              isRunning={isRunning}
              report={lastReport}
              filterText={filter}
            />
          ) : (
            <div className="rounded-xl border-2 border-zinc-600 bg-zinc-900 p-6 text-sm text-zinc-400">
              先点击“导入Markdown”选择本地测试用例文档（例如：Test_Plan_v1.0.md）
            </div>
          )}
        </div>

        <div
          className={cn(
            'group relative flex w-6 shrink-0 cursor-col-resize items-center justify-center transition-colors',
            isDragging ? 'bg-indigo-500/30' : 'hover:bg-zinc-800/50',
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <GripVertical className={cn(
            'h-4 w-4 transition-colors',
            isDragging ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'
          )} />

          {showWidthIndicator && (
            <div className="absolute -top-8 left-1/2 z-50 -translate-x-1/2 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 shadow-lg">
              {Math.round(leftWidth)}%
            </div>
          )}

          <div className="absolute inset-y-0 left-0 w-px bg-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="h-full overflow-hidden" style={{ width: `${100 - leftWidth}%` }}>
          <CaseDetailPanel
            testCase={activeCase}
            override={activeOverride}
            onChange={(patch) => {
              if (!activeCase) return;
              updateOverride(activeCase.id, patch);
            }}
            report={lastReport}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-600 bg-zinc-800/40 px-4 py-3">
      <div className="text-xs font-medium text-zinc-300">{label}</div>
      <div className={cn('mt-1 text-sm text-zinc-100', mono && 'font-mono text-xs')}>{value}</div>
    </div>
  );
}

