import { List } from 'lucide-react';

export default function PlaywrightCases() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-100">用例管理</div>
            <div className="mt-1 text-xs text-zinc-400">管理所有 Playwright 测试用例</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400">
              新建用例
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700">
              <List className="h-4 w-4" />
              导入
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
          <List className="h-16 w-16 text-zinc-600" />
          <div className="text-center">
            <div className="text-sm font-medium text-zinc-300">暂无用例</div>
            <div className="mt-1 text-xs">创建或导入用例开始管理</div>
          </div>
        </div>
      </div>
    </div>
  );
}
