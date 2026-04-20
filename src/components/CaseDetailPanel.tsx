import type { TestCase } from '../../shared/testPlan.js';
import type { RunReport } from '../../shared/runTypes.js';
import type { CaseExtractionResult } from '../hooks/useRunnerStore.js';
import StatusBadge from '@/components/StatusBadge';
import { Download, Play, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponseJsonPanel } from './ResponseJsonTree';
import { useVariableAutocomplete, VariablePopup } from './VariableAutocomplete';
import { useState } from 'react';

type VariableExtractor = {
  id: string;
  name: string;
  source: 'body' | 'header';
  path: string;
};

export default function CaseDetailPanel({
  testCase,
  override,
  onChange,
  report,
  onRun,
  onAddExtractor,
  onRemoveExtractor,
  disabled,
  extractionResult,
}: {
  testCase: TestCase | null;
  override: { requiresAuth?: boolean; headersText: string; queryText: string; bodyText: string; expectedResult?: string; path?: string; variableExtractors?: VariableExtractor[] } | null;
  onChange: (patch: Partial<{ requiresAuth?: boolean; headersText: string; queryText: string; bodyText: string; expectedResult?: string; path?: string }>) => void;
  report: RunReport | null;
  onRun?: (id: string) => void;
  onAddExtractor?: (caseId: string, extractor: VariableExtractor) => void;
  onRemoveExtractor?: (caseId: string, extractorId: string) => void;
  disabled?: boolean;
  extractionResult?: CaseExtractionResult | null;
}) {
  if (!testCase) {
    return (
      <div className="rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4 text-sm text-zinc-400">
        选择一条用例查看详情
      </div>
    );
  }

  const r = report?.results.find((x) => x.caseId === testCase.id);
  const o = override;
  const variableExtractors = o?.variableExtractors ?? testCase.variableExtractors ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-zinc-600 bg-zinc-900">
      <div className="shrink-0 border-b border-zinc-600 px-4 py-3 bg-zinc-800/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs text-zinc-400">{testCase.id}</div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">{testCase.title || '-'}</div>
            <div className="mt-1 text-xs text-zinc-500">{testCase.method}</div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {onRun && (
              <button
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-900/30 px-2 py-1 text-xs font-medium text-emerald-200 transition',
                  disabled ? 'pointer-events-none opacity-50' : 'hover:bg-emerald-900/50'
                )}
                onClick={() => onRun(testCase.id)}
              >
                <Play className="h-3 w-3" />
                运行
              </button>
            )}
            {r?.status ? <StatusBadge status={r.status} /> : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <label className={cn('inline-flex items-center gap-2', disabled && 'pointer-events-none opacity-60')}>
            <input
              type="checkbox"
              checked={typeof o?.requiresAuth === 'boolean' ? o.requiresAuth : testCase.requiresAuth !== false}
              onChange={(e) => onChange({ requiresAuth: e.target.checked })}
              disabled={disabled}
            />
            需要认证
          </label>
          <span className="text-zinc-600">优先级 {testCase.priority || '-'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className={cn('grid gap-3', disabled && 'pointer-events-none opacity-60')}>
          <Field label="路径 (path)" value={o?.path ?? testCase.path} onChange={(v) => onChange({ path: v })} rows={1} disabled={disabled} />
          <Field label="预期结果 (expectedResult)" value={o?.expectedResult ?? testCase.expectedResult ?? ''} onChange={(v) => onChange({ expectedResult: v })} rows={2} disabled={disabled} />
          <Field label="headers（JSON对象）" value={o?.headersText ?? '{}'} onChange={(v) => onChange({ headersText: v })} rows={4} disabled={disabled} />
          <Field label="query（JSON对象）" value={o?.queryText ?? '{}'} onChange={(v) => onChange({ queryText: v })} rows={3} disabled={disabled} />
          <Field label="body（JSON，POST/PUT 用）" value={o?.bodyText ?? ''} onChange={(v) => onChange({ bodyText: v })} rows={6} disabled={disabled} />

          <ExtractionInfoPanel variableExtractors={variableExtractors} extractionResult={extractionResult} />

          <div className={cn('rounded-lg border border-zinc-800 bg-zinc-950/40 p-3', !r && 'opacity-60')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-xs font-medium text-zinc-300">最近一次输出</div>
                {r?.httpStatus && (
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">HTTP {r.httpStatus}</span>
                )}
                {r?.durationMs && (
                  <span className="text-xs text-zinc-500">{r.durationMs} ms</span>
                )}
              </div>
              {r && report?.summary.runId && (
                <button
                  className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-700/60"
                  onClick={() => window.open(`/api/export/${report.summary.runId}?caseId=${testCase.id}`, '_blank')}
                >
                  <Download className="h-3 w-3" />
                  导出
                </button>
              )}
            </div>
            {r?.errorMessage && (
              <div className="mb-2 rounded border border-rose-800 bg-rose-950/40 p-2 text-xs text-rose-300">
                {r.errorMessage}
              </div>
            )}
            <ResponseJsonPanel
              responseBody={r?.responseBody}
              responseBodyPreview={r?.responseBodyPreview}
              variableExtractors={variableExtractors}
              onAddExtractor={onAddExtractor ? (extractor) => onAddExtractor(testCase.id, extractor) : undefined}
              onRemoveExtractor={onRemoveExtractor ? (extractorId) => onRemoveExtractor(testCase.id, extractorId) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  rows,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  disabled?: boolean;
}) {
  const { textareaProps, popupProps } = useVariableAutocomplete({ value, onChange });

  return (
    <label className={cn('grid gap-1', disabled && 'pointer-events-none opacity-60')}>
      <div className="text-xs font-medium text-zinc-300">{label}</div>
      <div className="relative">
        <textarea
          rows={rows}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 font-mono text-[12px] text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-zinc-700"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          disabled={disabled}
          {...textareaProps}
        />
        <VariablePopup {...popupProps} />
      </div>
    </label>
  );
}

function ExtractionInfoPanel({ variableExtractors, extractionResult }: {
  variableExtractors: Array<{ id: string; name: string; source: string; path: string }>;
  extractionResult?: CaseExtractionResult | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const appliedRules = extractionResult?.appliedRules ?? variableExtractors;
  const results = extractionResult?.extractionResults ?? [];

  if (appliedRules.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/30 transition"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span>提取信息</span>
        <span className="ml-auto text-zinc-500">{appliedRules.length} 条规则</span>
        {extractionResult && (
          <span className={cn(
            'ml-2 rounded px-1.5 py-0.5 text-[10px]',
            results.filter(r => r.success).length === appliedRules.length
              ? 'bg-emerald-900/50 text-emerald-300'
              : results.filter(r => r.success).length === 0
                ? 'bg-rose-900/50 text-rose-300'
                : 'bg-amber-900/50 text-amber-300'
          )}>
            {results.filter(r => r.success).length}/{appliedRules.length} 成功
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-2">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">应用规则</div>
          {appliedRules.map((rule) => {
            const result = results.find((r) => r.ruleId === rule.id);
            return (
              <div key={rule.id} className="flex items-start gap-2 rounded bg-zinc-900/60 px-2 py-1.5">
                <div className="mt-0.5">
                  {result?.success === true ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : result?.success === false ? (
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-cyan-400">${rule.name}</span>
                    <span className="text-zinc-600 text-xs">=</span>
                    <span className="font-mono text-xs text-zinc-500 truncate">{rule.path}</span>
                  </div>
                  {result?.success && result.value !== undefined && (
                    <div className="mt-0.5 font-mono text-[10px] text-zinc-400 truncate">
                      {typeof result.value === 'string' ? `"${result.value}"` : JSON.stringify(result.value)}
                    </div>
                  )}
                  {result?.success === false && result.error && (
                    <div className="mt-0.5 text-[10px] text-rose-400">{result.error}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
