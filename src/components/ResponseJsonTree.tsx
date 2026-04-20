import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonTreeProps {
  data: unknown;
  onExtract?: (path: string, value: unknown) => void;
  extractedPaths?: Set<string>;
  maxDepth?: number;
  currentDepth?: number;
  parentPath?: string;
}

export default function JsonTree({
  data,
  onExtract,
  extractedPaths = new Set(),
  maxDepth = 5,
  currentDepth = 0,
  parentPath = '',
}: JsonTreeProps) {
  if (currentDepth >= maxDepth) {
    return <span className="text-zinc-500">[...]</span>;
  }

  if (data === null) {
    return <span className="text-amber-400">null</span>;
  }

  if (data === undefined) {
    return <span className="text-zinc-500">undefined</span>;
  }

  if (typeof data === 'boolean') {
    return <span className={cn(data ? 'text-emerald-400' : 'text-rose-400')}>{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="text-cyan-400">{data}</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-lime-300">"{data}"</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-zinc-500">[]</span>;
    }
    return (
      <ArrayNode
        data={data}
        onExtract={onExtract}
        extractedPaths={extractedPaths}
        maxDepth={maxDepth}
        currentDepth={currentDepth}
        parentPath={parentPath}
      />
    );
  }

  if (typeof data === 'object') {
    if (Object.keys(data as object).length === 0) {
      return <span className="text-zinc-500">{'{}'}</span>;
    }
    return (
      <ObjectNode
        data={data as object}
        onExtract={onExtract}
        extractedPaths={extractedPaths}
        maxDepth={maxDepth}
        currentDepth={currentDepth}
        parentPath={parentPath}
      />
    );
  }

  return <span className="text-zinc-500">{String(data)}</span>;
}

function ObjectNode({
  data,
  onExtract,
  extractedPaths,
  maxDepth,
  currentDepth,
  parentPath,
}: {
  data: object;
  onExtract?: (path: string, value: unknown) => void;
  extractedPaths?: Set<string>;
  maxDepth?: number;
  currentDepth?: number;
  parentPath?: string;
}) {
  const [expanded, setExpanded] = useState(currentDepth < 2);

  const entries = Object.entries(data);

  return (
    <div className="pl-4">
      <div className="flex cursor-pointer items-center gap-1" onClick={() => setExpanded(!expanded)}>
        <button className="p-0.5 hover:bg-zinc-800 rounded">
          {expanded ? <ChevronDown className="h-3 w-3 text-zinc-400" /> : <ChevronRight className="h-3 w-3 text-zinc-400" />}
        </button>
        <span className="text-zinc-500">{expanded ? '{' : '{...}'}</span>
      </div>
      {expanded && (
        <>
          {entries.map(([key, value], index) => {
            const fullPath = parentPath ? `${parentPath}.${key}` : key;
            const isExtracted = extractedPaths?.has(fullPath);
            const isLast = index === entries.length - 1;

            return (
              <div key={key} className="pl-4">
                <div className="flex items-center gap-1 group">
                  <span className="text-cyan-400">"{key}"</span>
                  <span className="text-zinc-500">:</span>
                  <JsonTree
                    data={value}
                    onExtract={onExtract}
                    extractedPaths={extractedPaths}
                    maxDepth={maxDepth}
                    currentDepth={currentDepth + 1}
                    parentPath={fullPath}
                  />
                  {onExtract && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExtract(fullPath, value);
                      }}
                      className={cn(
                        'ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition',
                        isExtracted ? 'bg-emerald-600/30 text-emerald-400' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'
                      )}
                      title="提取为变量"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                  {isLast ? null : <span className="text-zinc-600">,</span>}
                </div>
              </div>
            );
          })}
          <div className="text-zinc-500">{'}'}</div>
        </>
      )}
    </div>
  );
}

function ArrayNode({
  data,
  onExtract,
  extractedPaths,
  maxDepth,
  currentDepth,
  parentPath,
}: {
  data: unknown[];
  onExtract?: (path: string, value: unknown) => void;
  extractedPaths?: Set<string>;
  maxDepth?: number;
  currentDepth?: number;
  parentPath?: string;
}) {
  const [expanded, setExpanded] = useState(currentDepth < 2);

  return (
    <div className="pl-4">
      <div className="flex cursor-pointer items-center gap-1" onClick={() => setExpanded(!expanded)}>
        <button className="p-0.5 hover:bg-zinc-800 rounded">
          {expanded ? <ChevronDown className="h-3 w-3 text-zinc-400" /> : <ChevronRight className="h-3 w-3 text-zinc-400" />}
        </button>
        <span className="text-zinc-500">{expanded ? '[' : '[...]'}</span>
        <span className="text-zinc-600 text-[10px]">{expanded ? `${data.length} items` : ''}</span>
      </div>
      {expanded && (
        <>
          {data.map((item, index) => {
            const fullPath = parentPath ? `${parentPath}[${index}]` : `[${index}]`;
            return (
              <div key={index} className="flex items-center gap-1 group pl-4">
                <span className="text-zinc-600 text-[10px] mr-1">{index}</span>
                <JsonTree
                  data={item}
                  onExtract={onExtract}
                  extractedPaths={extractedPaths}
                  maxDepth={maxDepth}
                  currentDepth={currentDepth + 1}
                  parentPath={fullPath}
                />
                <span className="text-zinc-600">,</span>
              </div>
            );
          })}
          <div className="text-zinc-500">]</div>
        </>
      )}
    </div>
  );
}

interface ExtractedVariable {
  id: string;
  name: string;
  source: 'body' | 'header';
  path: string;
}

interface ExtractConfig {
  path: string;
  value: unknown;
}

interface ResponseJsonPanelProps {
  responseBody?: string;
  responseBodyPreview?: string;
  variableExtractors?: ExtractedVariable[];
  onAddExtractor?: (extractor: ExtractedVariable) => void;
  onRemoveExtractor?: (extractorId: string) => void;
}

export function ResponseJsonPanel({
  responseBody,
  responseBodyPreview,
  variableExtractors = [],
  onAddExtractor,
  onRemoveExtractor,
}: ResponseJsonPanelProps) {
  const [copied, setCopied] = useState(false);
  const [extractModal, setExtractModal] = useState<ExtractConfig | null>(null);
  const [extractName, setExtractName] = useState('');

  const displayBody = responseBody ?? responseBodyPreview ?? '';

  let parsedJson: unknown = null;
  try {
    parsedJson = displayBody ? JSON.parse(displayBody) : null;
  } catch {
    parsedJson = null;
  }

  const extractedPaths = new Set(variableExtractors.map((v) => v.path));

  const handleCopy = useCallback(async () => {
    if (displayBody) {
      await navigator.clipboard.writeText(displayBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayBody]);

  const handleExtract = useCallback((path: string, value: unknown) => {
    const suggestedName = path.replace(/\.\d+|\.|\[|\]/g, '_').replace(/^_|_$/g, '').replace(/__+/g, '_');
    setExtractName(suggestedName);
    setExtractModal({ path, value });
  }, []);

  const handleConfirmExtract = useCallback(() => {
    if (extractModal && extractName.trim() && onAddExtractor) {
      const newExtractor: ExtractedVariable = {
        id: `extract_${Date.now()}`,
        name: extractName.trim(),
        source: 'body',
        path: extractModal.path,
      };
      onAddExtractor(newExtractor);
      setExtractModal(null);
      setExtractName('');
    }
  }, [extractModal, extractName, onAddExtractor]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-zinc-300">响应内容</div>
            {parsedJson && onAddExtractor && (
              <span className="text-[10px] text-cyan-500 bg-cyan-950/50 px-1.5 py-0.5 rounded">点击字段可提取</span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-700/60"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        <div className="max-h-80 overflow-auto rounded-md border border-zinc-800 bg-zinc-950/60 p-2 font-mono text-[11px]">
          {parsedJson ? (
            <JsonTree
              data={parsedJson}
              onExtract={onAddExtractor ? handleExtract : undefined}
              extractedPaths={extractedPaths}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-zinc-200">{displayBody || '无响应内容'}</pre>
          )}
        </div>
      </div>

      {variableExtractors.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-zinc-300">已配置的提取规则</div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">{variableExtractors.length} 条</span>
          </div>
          <div className="space-y-1">
            {variableExtractors.map((extractor) => (
              <div key={extractor.id} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400">{extractor.name}</span>
                  <span className="text-zinc-600 text-xs">=</span>
                  <span className="font-mono text-xs text-zinc-500">{extractor.path}</span>
                </div>
                {onRemoveExtractor && (
                  <button
                    onClick={() => onRemoveExtractor(extractor.id)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition"
                    title="删除提取规则"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {extractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-96 rounded-xl border border-zinc-600 bg-zinc-900 p-4 shadow-xl">
            <div className="text-sm font-medium text-zinc-100 mb-3">提取变量</div>
            <div className="mb-3 rounded border border-zinc-700 bg-zinc-950 p-2">
              <div className="text-xs text-zinc-400">字段路径</div>
              <div className="font-mono text-sm text-cyan-400">{extractModal.path}</div>
              <div className="mt-1 text-xs text-zinc-400">值</div>
              <div className="font-mono text-sm text-lime-300">
                {typeof extractModal.value === 'string'
                  ? `"${extractModal.value.substring(0, 50)}${extractModal.value.length > 50 ? '...' : ''}"`
                  : String(extractModal.value).substring(0, 100)}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-1">变量名</label>
              <input
                type="text"
                value={extractName}
                onChange={(e) => setExtractName(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                placeholder="输入变量名"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExtractModal(null)}
                className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={handleConfirmExtract}
                disabled={!extractName.trim()}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认提取
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
