import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FileUp, Play, Trash2, GripVertical, Wand2, Save, Package } from 'lucide-react';
import CaseDetailPanel from '@/components/CaseDetailPanel';
import CaseTable from '@/components/CaseTable';
import VariablesPanel from '@/components/VariablesPanel';
import { useRunnerStore } from '@/hooks/useRunnerStore';
import { cn } from '@/lib/utils';

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const swaggerInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState('');
  const [leftWidth, setLeftWidth] = useState(65);
  const [isDragging, setIsDragging] = useState(false);
  const [showWidthIndicator, setShowWidthIndicator] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveFilePath, setSaveFilePath] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isDragging: false });

  const {
    fileName,
    swaggerFileName,
    swaggerContent,
    parsed,
    selectedIds,
    overrides,
    settings,
    activeCaseId,
    isRunning,
    isGenerating,
    lastReport,
    error,
    uploadedDocuments,
    uploadedZipName,
    loadSettings,
    importMarkdown,
    importSwagger,
    generateFromSwagger,
    supplementCases,
    saveMarkdown,
    uploadDocumentsZip,
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
            <input
              ref={swaggerInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const swagger = JSON.parse(await f.text());
                  importSwagger(f.name, swagger);
                } catch {
                  alert('Swagger JSON 解析失败');
                }
                e.target.value = '';
              }}
            />
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                await uploadDocumentsZip(f.name);
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
                'inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-900/30 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-900/50',
                (isRunning || isGenerating || (!swaggerFileName && !uploadedDocuments.length)) && 'pointer-events-none opacity-50',
              )}
              onClick={() => void generateFromSwagger()}
            >
              <Wand2 className="h-4 w-4" />
              {isGenerating ? '生成中...' : 'AI生成用例'}
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-900/30 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-900/50',
                (isRunning || isGenerating || (!swaggerContent && !uploadedDocuments.length) || !parsed) && 'pointer-events-none opacity-50',
              )}
              onClick={() => void supplementCases()}
            >
              <Wand2 className="h-4 w-4" />
              补充用例
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-900/30 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-900/50',
                (isRunning || isGenerating) && 'pointer-events-none opacity-50',
              )}
              onClick={() => swaggerInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              {swaggerFileName ? `已上传: ${swaggerFileName}` : '上传Swagger'}
            </button>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-amber-600 bg-amber-900/30 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-900/50',
                (isRunning || isGenerating) && 'pointer-events-none opacity-50',
              )}
              onClick={() => zipInputRef.current?.click()}
            >
              <Package className="h-4 w-4" />
              {uploadedZipName ? `已上传: ${uploadedZipName}` : '上传文档包'}
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
            <InfoCard label="用例数量" value={parsed ? `${parsed.cases.length} 个` : '0 个'} />
            <InfoCard label="已上传文档" value={uploadedDocuments.length > 0 ? `${uploadedDocuments.length} 个文档` : (uploadedZipName || '-')} />
            <InfoCard
              label="最近一次执行"
              value={summary ? `${summary.passed}/${summary.total} 通过，${summary.failed} 失败` : '暂无'}
            />
          </div>
          <div className="flex items-center gap-2">
            {showSaveInput ? (
              <>
                <input
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  placeholder="输入保存路径，如 D:\TestTool\cases.md"
                  value={saveFilePath}
                  onChange={(e) => setSaveFilePath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && saveFilePath.trim()) {
                      void saveMarkdown(saveFilePath.trim());
                      setShowSaveInput(false);
                      setSaveFilePath('');
                    } else if (e.key === 'Escape') {
                      setShowSaveInput(false);
                      setSaveFilePath('');
                    }
                  }}
                  autoFocus
                />
                <button
                  className="rounded-lg border border-emerald-600 bg-emerald-900/30 px-2 py-1 text-sm text-emerald-200 transition hover:bg-emerald-900/50"
                  onClick={() => {
                    if (saveFilePath.trim()) {
                      void saveMarkdown(saveFilePath.trim());
                      setShowSaveInput(false);
                      setSaveFilePath('');
                    }
                  }}
                >
                  确认
                </button>
                <button
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 transition hover:bg-zinc-700"
                  onClick={() => {
                    setShowSaveInput(false);
                    setSaveFilePath('');
                  }}
                >
                  取消
                </button>
              </>
            ) : (
              <button
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-900/30 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-900/50',
                  (!parsed || parsed.cases.length === 0) && 'pointer-events-none opacity-50',
                )}
                onClick={() => setShowSaveInput(true)}
              >
                <Save className="h-4 w-4" />
                保存用例
              </button>
            )}
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
          <div className="flex h-full flex-col gap-2 overflow-hidden">
            <div className="flex-1 overflow-hidden">
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
            <div className="shrink-0">
              <VariablesPanel />
            </div>
          </div>
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

