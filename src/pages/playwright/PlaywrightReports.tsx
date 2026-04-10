import { FileText } from 'lucide-react';

export default function PlaywrightReports() {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <FileText className="h-4 w-4" />
          Playwright 执行报告
        </div>
      </div>

      <div className="rounded-xl border-2 border-zinc-600 bg-zinc-900 p-4">
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-zinc-400">
          <FileText className="h-16 w-16 text-zinc-600" />
          <div className="text-center">
            <div className="text-sm font-medium text-zinc-300">暂无报告</div>
            <div className="mt-1 text-xs">执行 Playwright 用例后查看报告</div>
          </div>
        </div>
      </div>
    </div>
  );
}
