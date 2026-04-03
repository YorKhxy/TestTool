import { useEffect, useMemo, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { apiJson } from '@/utils/http';
import type { RunReport } from '../../shared/runTypes.js';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

type ReportItem = {
  runId: string;
  startedAt?: string;
  finishedAt?: string;
  total?: number;
  passed?: number;
  failed?: number;
  durationMs?: number;
};

export default function Reports() {
  const [list, setList] = useState<ReportItem[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [report, setReport] = useState<RunReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiJson<{ success: true; data: ReportItem[] }>('/api/reports');
        setList(r.data);
        setActive(r.data[0]?.runId ?? null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '加载报告失败');
      }
    })();
  }, []);

  useEffect(() => {
    if (!active) {
      setReport(null);
      return;
    }
    void (async () => {
      try {
        const r = await apiJson<{ success: true; data: RunReport }>(`/api/reports/${active}`);
        setReport(r.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '加载报告失败');
      }
    })();
  }, [active]);

  const resultMap = useMemo(() => new Map(report?.results.map((r) => [r.caseId, r] as const) ?? []), [report]);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <FileText className="h-4 w-4" />
          执行报告
        </div>
        {error ? <div className="mt-2 text-sm text-rose-300">{error}</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="border-b border-zinc-800 px-4 py-3 text-xs font-medium text-zinc-400">历史（最多100条）</div>
          <div className="max-h-[640px] overflow-auto">
            {list.length === 0 ? (
              <div className="p-4 text-sm text-zinc-400">暂无报告</div>
            ) : (
              <div className="p-2">
                {list.map((it) => (
                  <button
                    key={it.runId}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800/40',
                      it.runId === active && 'bg-zinc-800/60',
                    )}
                    onClick={() => setActive(it.runId)}
                  >
                    <div className="font-mono text-xs text-zinc-400">{it.runId}</div>
                    <div className="mt-1 text-xs text-zinc-300">
                      {it.passed ?? 0}/{it.total ?? 0} 通过，{it.failed ?? 0} 失败
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{it.startedAt ?? ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/30">
          {report ? (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="grid gap-2 md:grid-cols-4">
                  <Metric label="总数" value={String(report.summary.total)} />
                  <Metric label="通过" value={String(report.summary.passed)} />
                  <Metric label="失败" value={String(report.summary.failed)} />
                  <Metric label="耗时" value={report.summary.durationMs ? `${report.summary.durationMs} ms` : '-'} />
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800/60"
                  onClick={() => window.open(`/api/export/${report.summary.runId}`, '_blank')}
                >
                  <Download className="h-4 w-4" />
                  导出Excel
                </button>
              </div>
              <div className="mt-4 max-h-[520px] overflow-auto rounded-lg border border-zinc-800">
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 bg-zinc-900/70 backdrop-blur">
                    <tr className="text-left text-xs text-zinc-400">
                      <th className="w-40 px-3 py-2">用例ID</th>
                      <th className="px-3 py-2">描述</th>
                      <th className="w-20 px-3 py-2">状态</th>
                      <th className="w-28 px-3 py-2">HTTP</th>
                      <th className="w-24 px-3 py-2">耗时</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {report.cases.map((c) => {
                      const r = resultMap.get(c.id);
                      return (
                        <tr key={c.id} className="border-t border-zinc-800/70">
                          <td className="px-3 py-2 font-mono text-xs text-zinc-200">{c.id}</td>
                          <td className="px-3 py-2 text-zinc-200">
                            <div className="truncate">{c.title || '-'}</div>
                            <div className="truncate font-mono text-xs text-zinc-500">{c.method} {c.path}</div>
                          </td>
                          <td className="px-3 py-2">{r?.status ? <StatusBadge status={r.status} /> : null}</td>
                          <td className="px-3 py-2 font-mono text-xs text-zinc-400">{r?.httpStatus ?? '-'}</td>
                          <td className="px-3 py-2 font-mono text-xs text-zinc-400">{r?.durationMs ?? '-'} ms</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-zinc-500">报告文件保存在 data/reports/{report.summary.runId}.json</div>
            </div>
          ) : (
            <div className="p-6 text-sm text-zinc-400">选择左侧报告查看详情</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/20 px-4 py-3">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className="mt-1 text-sm text-zinc-100">{value}</div>
    </div>
  );
}
