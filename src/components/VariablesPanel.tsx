import { useRunnerStore } from '@/hooks/useRunnerStore';
import { Trash2, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function VariablesPanel() {
  const { extractedVariables, clearExtractedVariables } = useRunnerStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const vars = Object.entries(extractedVariables);

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      void 0;
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const truncateValue = (value: string, maxLength = 50): string => {
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength) + '...';
  };

  if (vars.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-600 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-200">已提取的变量</h3>
        </div>
        <div className="text-xs text-zinc-500 italic">执行用例后，提取的变量将显示在这里</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-600 bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-600 bg-zinc-800/50">
        <h3 className="text-sm font-medium text-zinc-200">已提取的变量 ({vars.length})</h3>
        <button
          onClick={clearExtractedVariables}
          className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700/60 hover:text-zinc-300"
          title="清空所有变量"
        >
          <Trash2 className="h-3 w-3" />
          清空
        </button>
      </div>
      <div className="max-h-64 overflow-auto p-2">
        <div className="space-y-1">
          {vars.map(([key, value]) => {
            const strValue = formatValue(value);
            const displayValue = truncateValue(strValue);
            const isCopied = copiedKey === key;

            return (
              <div
                key={key}
                className="group flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 hover:border-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-cyan-400">{key}</span>
                    <span className="text-zinc-600">=</span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-zinc-400 break-all">
                    {displayValue}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(key, strValue)}
                  className="shrink-0 rounded p-1 text-zinc-500 opacity-0 transition hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100"
                  title="复制值"
                >
                  {isCopied ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-zinc-700 px-4 py-2 bg-zinc-800/30">
        <div className="text-xs text-zinc-500">
          使用方式：在 Headers/Query/Body 中使用 <code className="text-cyan-400">$&#123;变量名&#125;</code> 引用
        </div>
      </div>
    </div>
  );
}
