import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import type {
  PlaywrightExecutionLog,
  CaseExecutionLog,
  StepExecutionLog,
  ExecutionStatus,
} from '../../shared/playwrightCase';
import { cn } from '@/lib/utils';

interface ExecutionTerminalProps {
  executionLog: PlaywrightExecutionLog | null;
  isRunning: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function StatusIcon({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'running':
      return <Loader className="h-4 w-4 text-blue-400 animate-spin" />;
    case 'skipped':
      return <span className="text-zinc-400">⏭️</span>;
    case 'pending':
      return <Clock className="h-4 w-4 text-zinc-500" />;
    default:
      return <Clock className="h-4 w-4 text-zinc-500" />;
  }
}

function StepCard({
  step,
  isExpanded,
  onToggle,
}: {
  step: StepExecutionLog;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusColors: Record<string, string> = {
    passed: 'border-emerald-500/30 bg-emerald-500/5',
    failed: 'border-red-500/30 bg-red-500/5',
    running: 'border-blue-500/30 bg-blue-500/5',
    skipped: 'border-zinc-500/30 bg-zinc-500/5',
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        statusColors[step.status] || 'border-zinc-700',
      )}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
        <StatusIcon status={step.status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-zinc-200">
            <span className="text-zinc-400">[{step.stepType}]</span> {step.description}
          </div>
          {step.durationMs && (
            <div className="text-xs text-zinc-500 mt-0.5">耗时: {(step.durationMs / 1000).toFixed(2)}s</div>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-zinc-700/50 pt-3">
          {step.request && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">请求信息</div>
              <div className="rounded bg-zinc-800/50 p-2 text-xs font-mono">
                <div className="text-zinc-400">URL: {step.request.url || '-'}</div>
                <div className="text-zinc-400">Method: {step.request.method || '-'}</div>
                {step.request.headers && (
                  <div className="text-zinc-500 mt-1">Headers: {JSON.stringify(step.request.headers)}</div>
                )}
                {step.request.body && (
                  <div className="text-zinc-500 mt-1">
                    Body: {typeof step.request.body === 'string' ? step.request.body : JSON.stringify(step.request.body)}
                  </div>
                )}
              </div>
            </div>
          )}

          {step.response && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">响应信息</div>
              <div className="rounded bg-zinc-800/50 p-2 text-xs font-mono">
                <div className="text-zinc-400">Status: {step.response.status || '-'}</div>
                {step.response.body && (
                  <div className="text-zinc-500 mt-1">
                    Body: {typeof step.response.body === 'string' ? step.response.body : JSON.stringify(step.response.body).slice(0, 300)}
                  </div>
                )}
              </div>
            </div>
          )}

          {step.assertResult && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">断言结果</div>
              <div className="rounded bg-zinc-800/50 p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">预期:</span>
                  <span className="text-zinc-200">{step.assertResult.expected}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">实际:</span>
                  <span className="text-zinc-200">{step.assertResult.actual}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">操作符:</span>
                  <span className="text-zinc-200">{step.assertResult.operator}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-400">结果:</span>
                  <span className={step.assertResult.passed ? 'text-emerald-400' : 'text-red-400'}>
                    {step.assertResult.passed ? '✅ 通过' : '❌ 失败'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step.error && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-400">错误信息</div>
              <div className="rounded bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-300 font-mono">
                {step.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CaseCard({
  caseLog,
  isExpanded,
  onToggle,
  expandedStepId,
  onToggleStep,
}: {
  caseLog: CaseExecutionLog;
  isExpanded: boolean;
  onToggle: () => void;
  expandedStepId: string | null;
  onToggleStep: (stepId: string) => void;
}) {
  const statusColors: Record<string, string> = {
    passed: 'border-emerald-500/50 bg-emerald-500/10',
    failed: 'border-red-500/50 bg-red-500/10',
    running: 'border-blue-500/50 bg-blue-500/10',
    skipped: 'border-zinc-500/50 bg-zinc-500/10',
  };

  return (
    <div className={cn('rounded-lg border transition-all', statusColors[caseLog.status] || 'border-zinc-700')}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
        <StatusIcon status={caseLog.status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-200">
            {caseLog.caseId} - {caseLog.caseTitle}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {caseLog.passedSteps}/{caseLog.totalSteps} 步骤通过
            {caseLog.durationMs && ` • ${(caseLog.durationMs / 1000).toFixed(2)}s`}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-zinc-700/50 pt-3">
          {caseLog.stepLogs.map((step) => (
            <StepCard
              key={step.stepId}
              step={step}
              isExpanded={expandedStepId === step.stepId}
              onToggle={() => onToggleStep(expandedStepId === step.stepId ? '' : step.stepId)}
            />
          ))}
          {caseLog.error && (
            <div className="rounded bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <div className="font-medium mb-1">错误:</div>
              <div className="font-mono">{caseLog.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionTerminal({
  executionLog,
  isRunning,
  isOpen,
  onToggle,
}: ExecutionTerminalProps) {
  const [expandedCaseIds, setExpandedCaseIds] = useState<Set<string>>(new Set());
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLogLengthRef = useRef(0);

  useEffect(() => {
    if (executionLog && executionLog.caseLogs.length > prevLogLengthRef.current) {
      const latestCase = executionLog.caseLogs[executionLog.caseLogs.length - 1];
      setExpandedCaseIds((prev) => new Set([...prev, latestCase.caseId]));
    }
    prevLogLengthRef.current = executionLog?.caseLogs.length || 0;

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [executionLog]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-zinc-200 shadow-lg hover:bg-zinc-700 transition-all"
      >
        <div className="flex items-center gap-2">
          {isRunning && <Loader className="h-4 w-4 text-blue-400 animate-spin" />}
          <span>执行日志</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[600px] max-h-[500px] rounded-xl bg-zinc-900 border border-zinc-600 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-100">执行日志</h3>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400">
              <Loader className="h-3 w-3 animate-spin" />
              执行中...
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      {executionLog && (
        <div className="px-4 py-2 border-b border-zinc-700 bg-zinc-800/30">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400">
              总计: <span className="text-zinc-200">{executionLog.totalCases}</span>
            </span>
            <span className="text-emerald-400">
              通过: <span className="font-medium">{executionLog.passedCases}</span>
            </span>
            <span className="text-red-400">
              失败: <span className="font-medium">{executionLog.failedCases}</span>
            </span>
            <span className="text-zinc-500">
              跳过: <span className="font-medium">{executionLog.skippedCases}</span>
            </span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {executionLog ? (
          executionLog.caseLogs.map((caseLog) => (
            <CaseCard
              key={caseLog.caseId}
              caseLog={caseLog}
              isExpanded={expandedCaseIds.has(caseLog.caseId)}
              onToggle={() => {
                setExpandedCaseIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(caseLog.caseId)) {
                    next.delete(caseLog.caseId);
                  } else {
                    next.add(caseLog.caseId);
                  }
                  return next;
                });
              }}
              expandedStepId={expandedStepId}
              onToggleStep={(stepId) => setExpandedStepId(stepId)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Clock className="h-12 w-12 mb-3" />
            <div className="text-sm">暂无执行记录</div>
          </div>
        )}
      </div>
    </div>
  );
}
