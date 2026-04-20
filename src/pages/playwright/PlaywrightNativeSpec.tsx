import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Play, Square, Upload } from 'lucide-react';
import { apiJson } from '@/utils/http';
import { cn } from '@/lib/utils';
import { usePlaywrightStore } from '@/hooks/usePlaywrightStore';

type NativeReportStatus = 'passed' | 'failed' | 'skipped' | 'flaky' | 'pending';

type NativeReportTest = {
  id: string;
  title: string;
  describePath: string[];
  steps?: string[];
  file?: string;
  project?: string;
  status: NativeReportStatus;
  durationMs: number;
  error?: string;
};

type NativeReport = {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    durationMs: number;
  };
  tests: NativeReportTest[];
};

type NativeRunResponse = {
  success: boolean;
  data?: {
    runId: string;
    fileName: string;
    tempFilePath: string;
    sourceFilePath: string;
    executionCwd: string;
    cliPath: string;
    reportPath?: string | null;
    report?: NativeReport | null;
    exitCode: number;
    signal: string | null;
    durationMs: number;
    stdout: string;
    stderr: string;
  };
  error?: string;
};

type NativeStopResponse = {
  success: boolean;
  data?: {
    runId: string;
    message: string;
  };
  error?: string;
};

function parseParenthesizedContent(source: string, openParenIndex: number): { content: string; endIndex: number } | null {
  if (source[openParenIndex] !== '(') return null;
  let depth = 1;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;
  for (let i = openParenIndex + 1; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0) {
      return {
        content: source.slice(openParenIndex + 1, i),
        endIndex: i,
      };
    }
  }
  return null;
}

function parseFunctionBody(source: string, searchFrom: number): { body: string; endIndex: number } | null {
  const arrowIndex = source.indexOf('=>', searchFrom);
  if (arrowIndex === -1) return null;
  const braceStart = source.indexOf('{', arrowIndex);
  if (braceStart === -1) return null;

  let depth = 1;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;
  for (let i = braceStart + 1; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) {
      return {
        body: source.slice(braceStart + 1, i),
        endIndex: i,
      };
    }
  }
  return null;
}

function extractStepsFromTestBody(body: string): string[] {
  const explicitSteps: string[] = [];
  const explicitRegex = /test\.step\s*\(\s*(['"`])([\s\S]*?)\1\s*,/g;
  let explicitMatch: RegExpExecArray | null = explicitRegex.exec(body);
  while (explicitMatch) {
    const title = explicitMatch[2].replace(/\s+/g, ' ').trim();
    if (title) explicitSteps.push(title);
    explicitMatch = explicitRegex.exec(body);
  }
  if (explicitSteps.length > 0) {
    return explicitSteps;
  }

  const fallbackSteps: string[] = [];
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith('//')) continue;
    if (line.startsWith('await ') || line.startsWith('expect(')) {
      fallbackSteps.push(line.replace(/;$/, ''));
    }
    if (fallbackSteps.length >= 12) break;
  }
  return fallbackSteps;
}

function parsePreviewReportFromSpecContent(content: string, fileName: string): NativeReport | null {
  const markerRegex = /\btest(?:\.(?:only|skip|fixme|fail|slow))*\s*\(/g;
  const parsedTests: NativeReportTest[] = [];
  let marker = markerRegex.exec(content);

  while (marker) {
    const openParenIndex = marker.index + marker[0].length - 1;
    const call = parseParenthesizedContent(content, openParenIndex);
    if (!call) {
      marker = markerRegex.exec(content);
      continue;
    }

    const titleMatch = call.content.match(/^\s*(['"`])([\s\S]*?)\1/);
    if (!titleMatch) {
      marker = markerRegex.exec(content);
      continue;
    }
    const title = titleMatch[2].replace(/\s+/g, ' ').trim() || '(unnamed test)';
    const body = parseFunctionBody(content, openParenIndex);
    const steps = body ? extractStepsFromTestBody(body.body) : [];

    parsedTests.push({
      id: `${parsedTests.length + 1}`,
      title,
      describePath: [fileName],
      steps,
      status: 'pending',
      durationMs: 0,
    });

    markerRegex.lastIndex = body?.endIndex ?? call.endIndex;
    marker = markerRegex.exec(content);
  }

  if (parsedTests.length === 0) return null;

  return {
    summary: {
      total: parsedTests.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      durationMs: 0,
    },
    tests: parsedTests,
  };
}

function mergePreviewWithExecutedReport(preview: NativeReport | null, executed: NativeReport | null): NativeReport | null {
  if (!preview) return executed;
  if (!executed) return preview;

  const mergedTests = executed.tests.map((execItem, index) => {
    const previewByIndex = preview.tests[index];
    const previewByTitle = preview.tests.find((item) => item.title === execItem.title);
    const candidate = previewByTitle ?? previewByIndex;
    return {
      ...execItem,
      steps: execItem.steps && execItem.steps.length > 0 ? execItem.steps : candidate?.steps || [],
      describePath:
        execItem.describePath && execItem.describePath.length > 0
          ? execItem.describePath
          : candidate?.describePath || [],
    };
  });

  return {
    ...executed,
    tests: mergedTests,
  };
}


export default function PlaywrightNativeSpec() {
  const { settings } = usePlaywrightStore();
  const [activeTab, setActiveTab] = useState<'stdout' | 'stderr' | 'report'>('stdout');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NativeRunResponse['data'] | null>(null);
  const [previewReport, setPreviewReport] = useState<NativeReport | null>(null);

  const canRun = useMemo(
    () =>
      Boolean(
        (selectedFile && /\.(spec\.(ts|js)|ts|js)$/i.test(selectedFile.name)) ||
          (filePath.trim() && /\.(spec\.(ts|js)|ts|js)$/i.test(filePath.trim())),
      ),
    [selectedFile, filePath],
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setResult(null);
    setSelectedFile(file);
    if (!file) {
      setPreviewReport(null);
      return;
    }
    try {
      const fileContent = await file.text();
      const parsed = parsePreviewReportFromSpecContent(fileContent, file.name);
      setPreviewReport(parsed);
      if (parsed) {
        setActiveTab('report');
      }
    } catch {
      setPreviewReport(null);
    }
  };

  const handleRun = async () => {
    const trimmedFilePath = filePath.trim();

    if (!trimmedFilePath && !selectedFile) {
      setError('请先选择 .spec.ts / .spec.js 文件，或填写原始文件路径。');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const pathToRun = trimmedFilePath;
      const usePathMode = Boolean(pathToRun);
      const content = selectedFile && !usePathMode ? await selectedFile.text() : '';
      const response = await apiJson<NativeRunResponse>('/api/playwright/native/run', {
        method: 'POST',
        body: JSON.stringify({
          content,
          fileName: selectedFile?.name,
          filePath: pathToRun || undefined,
          settings: {
            browser: settings.browser,
            headless: settings.headless,
            timeout: settings.timeout,
            baseURL: settings.baseURLEnabled ? settings.baseURL : '',
          },
        }),
      });

      if (!response.data) {
        setError(response.error || '原生 Spec 执行失败。');
        return;
      }

      const mergedReport = mergePreviewWithExecutedReport(previewReport, response.data.report || null);
      setResult({
        ...response.data,
        report: mergedReport,
      });
      setActiveTab(mergedReport ? 'report' : 'stdout');
      if (!response.success || response.data.exitCode !== 0) {
        setError(response.error || `执行失败，退出码 ${response.data.exitCode}`);
        setActiveTab('stderr');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '原生 Spec 执行失败。');
    } finally {
      setIsRunning(false);
      setIsStopping(false);
    }
  };

  const handleStop = async () => {
    if (!isRunning || isStopping) return;
    setIsStopping(true);
    try {
      const response = await apiJson<NativeStopResponse>('/api/playwright/native/stop', {
        method: 'POST',
      });
      if (!response.success) {
        setError(response.error || '停止执行失败。');
        return;
      }
      setError('已发送停止指令，等待进程退出...');
    } catch (e) {
      setError(e instanceof Error ? e.message : '停止执行失败。');
    } finally {
      setIsStopping(false);
    }
  };

  const firstErrorLine =
    (result?.stderr || '')
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) || '无';

  const getStatusText = (status: NativeReportStatus) => {
    switch (status) {
      case 'passed':
        return '通过';
      case 'failed':
        return '失败';
      case 'skipped':
        return '跳过';
      case 'flaky':
        return '不稳定';
      case 'pending':
        return '待执行';
      default:
        return status;
    }
  };

  const formatDurationSec = (durationMs: number) => `${(durationMs / 1000).toFixed(3)}s`;
  const reportData = result?.report || previewReport;

  return (
    <div className="grid h-full gap-4 overflow-hidden">
      <div className="rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Playwright 原生 Spec</div>
            <div className="mt-1 text-xs text-zinc-400">直接运行 .spec.ts / .spec.js，不经过步骤解析或转换。</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={!canRun || isRunning}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition',
                canRun && !isRunning ? 'bg-emerald-600 hover:bg-emerald-500' : 'cursor-not-allowed bg-zinc-700 opacity-60',
              )}
            >
              <Play className="h-4 w-4" />
              {isRunning ? '运行中...' : '直接运行'}
            </button>
            {isRunning && (
              <button
                onClick={handleStop}
                disabled={isStopping}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition',
                  !isStopping ? 'hover:bg-red-500' : 'cursor-not-allowed opacity-60',
                )}
              >
                <Square className="h-4 w-4" />
                {isStopping ? '停止中...' : '停止执行'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 rounded-xl border border-zinc-700 bg-zinc-950/50 p-4 lg:grid-cols-2">
          <div className="min-w-0">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400">
              <Upload className="h-4 w-4" />
              选择原生 Spec 文件
              <input type="file" accept=".spec.ts,.spec.js,.ts,.js" className="hidden" onChange={handleFileChange} />
            </label>

            <div className="mt-3 truncate text-sm text-zinc-300">{selectedFile ? selectedFile.name : '尚未选择上传文件'}</div>
            <div className="mt-1 text-xs text-zinc-500">使用当前 Playwright 设置中的浏览器、headless、timeout 和 BaseURL 环境变量执行。</div>

            <div className="mt-4">
              <label className="grid gap-2">
                <span className="text-xs font-medium text-zinc-300">或填写原始文件路径</span>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="例如：D:\\project\\tests\\core-modules.spec.js"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                />
              </label>
              <div className="mt-1 text-xs text-zinc-500">路径模式会直接运行原始文件，适合包含相对 import 的 Spec。</div>
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400">
            <div className="mb-2 text-xs font-semibold text-zinc-200">运行诊断信息</div>
            <div className="break-all">运行文件: {result?.sourceFilePath || '无'}</div>
            <div className="break-all">执行目录: {result?.executionCwd || '无'}</div>
            <div className="break-all">CLI 路径: {result?.cliPath || '无'}</div>
            <div className="break-all">报告路径: {result?.reportPath || '无'}</div>
            <div className="break-all">记录文件: {result?.tempFilePath || '无'}</div>
            <div className="mt-1 break-all">首条错误: {result ? firstErrorLine : '无'}</div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {result && result.exitCode === 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-sm text-emerald-300">执行成功，耗时 {formatDurationSec(result.durationMs)}</span>
          </div>
        )}
      </div>

      <section className="min-h-0 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('stdout')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              activeTab === 'stdout'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                : 'border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:bg-zinc-800/70',
            )}
          >
            标准输出
          </button>
          <button
            onClick={() => setActiveTab('stderr')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              activeTab === 'stderr'
                ? 'border-rose-400/40 bg-rose-500/10 text-rose-300'
                : 'border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:bg-zinc-800/70',
            )}
          >
            错误输出
          </button>
          <button
            onClick={() => setActiveTab('report')}
            disabled={!reportData}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              !reportData && 'cursor-not-allowed opacity-50',
              activeTab === 'report'
                ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300'
                : 'border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:bg-zinc-800/70',
            )}
          >
            结构化 Reporter
          </button>
        </div>

        <div className="mt-3 min-h-0">
          {activeTab === 'stdout' && (
            <pre className="h-[540px] w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-5 text-zinc-300 whitespace-pre-wrap break-all">
              {result?.stdout || '暂无输出'}
            </pre>
          )}

          {activeTab === 'stderr' && (
            <pre className="h-[540px] w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-5 text-zinc-300 whitespace-pre-wrap break-all">
              {result?.stderr || '暂无错误输出'}
            </pre>
          )}

          {activeTab === 'report' && (
            <div className="h-[540px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              {reportData ? (
                <>
                  <div className="grid gap-2 text-xs text-zinc-300 md:grid-cols-6">
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">总数: {reportData.summary.total}</div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">通过: {reportData.summary.passed}</div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">失败: {reportData.summary.failed}</div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">跳过: {reportData.summary.skipped}</div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">波动: {reportData.summary.flaky}</div>
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">时长: {formatDurationSec(reportData.summary.durationMs)}</div>
                  </div>
                  <div className="mt-3 overflow-auto rounded border border-zinc-800">
                    <table className="w-full table-fixed text-left text-xs text-zinc-300">
                      <thead className="sticky top-0 bg-zinc-900">
                        <tr>
                          <th className="px-3 py-2">状态</th>
                          <th className="px-3 py-2">描述/用例</th>
                          <th className="px-3 py-2">步骤</th>
                          <th className="px-3 py-2">项目</th>
                          <th className="px-3 py-2">耗时</th>
                          <th className="px-3 py-2">错误</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.tests.map((item) => (
                          <tr key={item.id} className="border-t border-zinc-800">
                            <td className="w-20 px-3 py-2">{getStatusText(item.status)}</td>
                            <td className="px-3 py-2 break-all">{[...item.describePath, item.title].join(' / ')}</td>
                            <td className="w-96 px-3 py-2">
                              {item.steps && item.steps.length > 0 ? (
                                <div className="space-y-1">
                                  {item.steps.map((step, idx) => (
                                    <div key={`${item.id}_step_${idx}`} className="break-all text-zinc-300">
                                      {idx + 1}. {step}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-zinc-500">无</span>
                              )}
                            </td>
                            <td className="w-36 px-3 py-2 break-all">{item.project || '无'}</td>
                            <td className="w-24 px-3 py-2">
                              {item.status === 'pending' ? '-' : formatDurationSec(item.durationMs)}
                            </td>
                            <td className="w-64 px-3 py-2 break-all">{item.error || '无'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-xs text-zinc-400">暂无结构化报告</div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
