import { useState } from 'react';
import { List, Upload, AlertCircle, Play, Pause, Square } from 'lucide-react';
import { usePlaywrightStore } from '@/hooks/usePlaywrightStore';
import PlaywrightCaseTable from '@/components/PlaywrightCaseTable';
import PlaywrightCaseDetail from '@/components/PlaywrightCaseDetail';
import CaseImportModal from '@/components/CaseImportModal';
import ExecutionTerminal from '@/components/ExecutionTerminal';
import { cn } from '@/lib/utils';

export default function PlaywrightWorkbench() {
  const {
    loadedCases,
    executionQueue,
    selectedIds,
    activeCaseId,
    isLoading,
    isExecuting,
    isPaused,
    executingCaseId,
    caseStatuses,
    currentExecutionLog,
    fileName,
    error,
    importCases,
    setActiveCase,
    toggleSelect,
    selectAll,
    deselectAll,
    moveCaseUp,
    moveCaseDown,
    reorderCases,
    deleteCase,
    clearCases,
    runCases,
    getSelectedCases,
    cancelRun,
    pauseExecution,
    resumeExecution,
    progressState,
  } = usePlaywrightStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  const activeCase = loadedCases.find((c) => c.id === activeCaseId) || null;
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const handleRunSingle = (id: string) => {
    runCases([id]);
  };

  const handleDelete = (id: string) => {
    deleteCase(id);
    if (activeCaseId === id) {
      setIsDetailOpen(false);
    }
  };

  const handleOpenDetail = (id: string) => {
    setActiveCase(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">Playwright 工作台</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              {fileName ? (
                <>
                  <span className="truncate max-w-[200px]">{fileName}</span>
                  <span className="text-zinc-600">|</span>
                  <span>{loadedCases.length} 个用例</span>
                  {selectedCount > 0 && (
                    <>
                      <span className="text-zinc-600">|</span>
                      <span className="text-indigo-400">已选 {selectedCount}</span>
                    </>
                  )}
                </>
              ) : (
                <span>未加载用例</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              disabled={isExecuting}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition',
                !isExecuting ? 'hover:bg-indigo-400' : 'opacity-50 cursor-not-allowed',
              )}
            >
              <Upload className="h-4 w-4" />
              导入用例
            </button>
            {fileName && (
              <button
                onClick={clearCases}
                disabled={isExecuting || loadedCases.length === 0}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition',
                  !isExecuting && loadedCases.length > 0 ? 'hover:bg-zinc-700' : 'opacity-50 cursor-not-allowed',
                )}
              >
                清空
              </button>
            )}
            {isExecuting ? (
              isPaused ? (
                <button
                  onClick={() => void resumeExecution()}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500"
                >
                  <Play className="h-4 w-4" />
                  继续
                </button>
              ) : (
                <button
                  onClick={() => void pauseExecution()}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-500"
                >
                  <Pause className="h-4 w-4" />
                  暂停
                </button>
              )
            ) : selectedCount > 0 ? (
              <button
                onClick={() => {
                  const cases = getSelectedCases();
                  void runCases(cases.map((c) => c.id));
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500"
              >
                <Play className="h-4 w-4" />
                执行已选中 ({selectedCount})
              </button>
            ) : null}
            {isExecuting && (
              <button
                onClick={() => void cancelRun()}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
              >
                <Square className="h-4 w-4" />
                停止
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        {loadedCases.length > 0 ? (
          <div className="h-full flex gap-4">
            <div className={cn('flex-1 overflow-hidden', isDetailOpen && 'flex-1')}>
              <PlaywrightCaseTable
                cases={loadedCases}
                executionQueue={executionQueue}
                selectedIds={selectedIds}
                activeCaseId={activeCaseId}
                caseStatuses={caseStatuses}
                isExecuting={isExecuting}
                executingCaseId={executingCaseId}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onOpen={handleOpenDetail}
                onRunSingle={handleRunSingle}
                onMoveUp={moveCaseUp}
                onMoveDown={moveCaseDown}
                onDragReorder={reorderCases}
              />
            </div>

            {isDetailOpen && activeCase && (
              <div className="w-[420px] shrink-0">
                <PlaywrightCaseDetail
                  caseData={activeCase}
                  isOpen={isDetailOpen}
                  onClose={() => setIsDetailOpen(false)}
                  onRun={handleRunSingle}
                  onDelete={handleDelete}
                  isExecuting={isExecuting}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
            <List className="h-16 w-16 text-zinc-600" />
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-300">暂无用例</div>
              <div className="mt-1 text-xs">导入 Playwright 测试用例开始管理</div>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              <Upload className="h-4 w-4" />
              导入用例
            </button>
          </div>
        )}
      </div>

      <CaseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importCases}
        isLoading={isLoading}
      />

      <ExecutionTerminal
        executionLog={currentExecutionLog}
        isRunning={isExecuting}
        isOpen={isTerminalOpen}
        onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
        onCancel={cancelRun}
        progressState={progressState}
      />
    </div>
  );
}
