import type { TestCase } from '../../shared/testPlan.js';
import type { RunReport } from '../../shared/runTypes.js';
import StatusBadge from '@/components/StatusBadge';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CaseDetailPanel({
  testCase,
  override,
  onChange,
  report,
}: {
  testCase: TestCase | null;
  override: { requiresAuth?: boolean; headersText: string; queryText: string; bodyText: string } | null;
  onChange: (patch: Partial<{ requiresAuth?: boolean; headersText: string; queryText: string; bodyText: string }>) => void;
  report: RunReport | null;
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

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-zinc-600 bg-zinc-900">
      <div className="shrink-0 border-b border-zinc-600 px-4 py-3 bg-zinc-800/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs text-zinc-400">{testCase.id}</div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">{testCase.title || '-'}</div>
            <div className="mt-1 font-mono text-xs text-zinc-500">{testCase.method} {testCase.path}</div>
          </div>
          <div className="mt-1">{r?.status ? <StatusBadge status={r.status} /> : null}</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={typeof o?.requiresAuth === 'boolean' ? o.requiresAuth : testCase.requiresAuth !== false}
              onChange={(e) => onChange({ requiresAuth: e.target.checked })}
            />
            需要认证
          </label>
          <span className="text-zinc-600">优先级 {testCase.priority || '-'}</span>
        </div>
        {testCase.expectedResult ? (
          <div className="mx-4 mt-3 rounded-lg border border-zinc-700/50 bg-zinc-800/20 p-3">
            <div className="text-xs font-medium text-zinc-300">预期结果</div>
            <div className="mt-1 text-xs text-zinc-400 whitespace-pre-wrap">{testCase.expectedResult}</div>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3">
          <Field label="headers（JSON对象）" value={o?.headersText ?? '{}'} onChange={(v) => onChange({ headersText: v })} rows={4} />
          <Field label="query（JSON对象）" value={o?.queryText ?? '{}'} onChange={(v) => onChange({ queryText: v })} rows={3} />
          <Field label="body（JSON，POST/PUT 用）" value={o?.bodyText ?? ''} onChange={(v) => onChange({ bodyText: v })} rows={6} />

          <div className={cn('rounded-lg border border-zinc-800 bg-zinc-950/40 p-3', !r && 'opacity-60')}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-zinc-300">最近一次输出</div>
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
            <div className="mt-2 grid gap-2 text-xs text-zinc-400">
              <div>HTTP：{r?.httpStatus ?? '-'}</div>
              <div>耗时：{r?.durationMs ?? '-'} ms</div>
              {r?.errorMessage ? <div className="text-rose-300">错误：{r.errorMessage}</div> : null}
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950/60 p-2 font-mono text-[11px] text-zinc-200">
                {r?.responseBodyPreview ?? ''}
              </pre>
            </div>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="grid gap-1">
      <div className="text-xs font-medium text-zinc-300">{label}</div>
      <textarea
        rows={rows}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 font-mono text-[12px] text-zinc-100 outline-none ring-0 placeholder:text-zinc-600 focus:border-zinc-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </label>
  );
}

