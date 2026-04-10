import { PlayCircle, List, Settings, FileText } from 'lucide-react';

export default function PlaywrightWorkbench() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">Playwright 工作台</div>
            <div className="mt-1 text-xs text-zinc-400">通过浏览器自动化执行 Web 应用测试用例</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700">
              <List className="h-4 w-4" />
              导入用例
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700">
              <Settings className="h-4 w-4" />
              浏览器设置
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
          <PlayCircle className="h-16 w-16 text-zinc-600" />
          <div className="text-center">
            <div className="text-sm font-medium text-zinc-300">Playwright 模式</div>
            <div className="mt-1 text-xs">导入用例文件或创建新用例开始测试</div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400">
              导入用例
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700">
              创建新用例
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
