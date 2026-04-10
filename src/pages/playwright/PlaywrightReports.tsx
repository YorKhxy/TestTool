import { useEffect, useState } from 'react';
import { FileText, Download, Trash2, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import type { PlaywrightExecutionLog } from '../../shared/playwrightCase';
import { apiJson } from '@/utils/http';
import { cn } from '@/lib/utils';

export default function PlaywrightReports() {
  const [logs, setLogs] = useState<PlaywrightExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const r = await apiJson<{ success: boolean; data: PlaywrightExecutionLog[] }>(
        '/api/playwright/logs'
      );
      if (r.success) {
        setLogs(r.data);
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExport = async (logId: string) => {
    try {
      setExportingId(logId);
      const response = await fetch('/api/playwright/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `playwright_report_${logId}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;\n"']+)/i);
        if (match) {
          fileName = decodeURIComponent(match[1]);
        }
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm('确定要删除这条执行记录吗？')) return;
    try {
      setDeletingId(logId);
      await apiJson(`/api/playwright/logs/${logId}`, { method: 'DELETE' });
      await loadLogs();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">Playwright 执行报告</div>
            <div className="mt-1 text-xs text-zinc-400">查看历史执行记录并导出报告</div>
          </div>
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition',
              !isLoading ? 'hover:bg-zinc-700' : 'opacity-50 cursor-not-allowed',
            )}
          >
            <Loader className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            刷新
          </button>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
            <Loader className="h-12 w-12 animate-spin text-zinc-500" />
            <div className="text-sm">加载中...</div>
          </div>
        ) : logs.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-zinc-800 border-b border-zinc-600">
                <tr className="text-left text-xs text-zinc-400">
                  <th className="px-4 py-3">执行ID</th>
                  <th className="px-4 py-3">套件名称</th>
                  <th className="px-4 py-3">执行时间</th>
                  <th className="px-4 py-3">耗时</th>
                  <th className="px-4 py-3">总数</th>
                  <th className="px-4 py-3">通过</th>
                  <th className="px-4 py-3">失败</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-zinc-700 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-zinc-300 truncate" title={log.runId}>
                        {log.runId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-200 truncate">{log.suiteName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-400 text-xs">{formatTime(log.startedAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-400 text-xs">{formatDuration(log.durationMs)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-zinc-200">{log.totalCases}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-emerald-400">{log.passedCases}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={log.failedCases > 0 ? 'text-red-400' : 'text-zinc-400'}>
                        {log.failedCases}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.failedCases > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                          <XCircle className="h-3 w-3" /> 失败
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                          <CheckCircle className="h-3 w-3" /> 通过
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExport(log.id)}
                          disabled={exportingId === log.id}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition',
                            'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
                            exportingId === log.id && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          <Download className="h-3 w-3" />
                          {exportingId === log.id ? '导出中' : '导出'}
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition',
                            'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20',
                            deletingId === log.id && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingId === log.id ? '删除中' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
            <FileText className="h-16 w-16 text-zinc-600" />
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-300">暂无执行报告</div>
              <div className="mt-1 text-xs">执行 Playwright 用例后查看报告</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
