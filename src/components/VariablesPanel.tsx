import { useState, useRef } from 'react';
import { useRunnerStore } from '@/hooks/useRunnerStore';
import { Trash2, Copy, CheckCircle, Upload, Download, Plus, Edit2, X, Check } from 'lucide-react';
import type { ExtractionRule } from './ExtractionRules';
import { parseRulesFromJson, parseRulesFromMarkdown, exportRulesToJson } from './ExtractionRules';

export default function VariablesPanel() {
  const {
    extractedVariables,
    clearExtractedVariables,
    addExtractionRule,
    removeExtractionRule,
    updateExtractionRule,
    extractionRules,
    activeCaseId,
    parsed,
    overrides,
    updateCaseExtractors,
  } = useRunnerStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState<ExtractionRule | null>(null);
  const [editName, setEditName] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editSource, setEditSource] = useState<'body' | 'header'>('body');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCase = parsed?.cases.find((c) => c.id === activeCaseId);
  const activeOverride = activeCaseId ? overrides[activeCaseId] : null;

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

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      let rules: ExtractionRule[] = [];

      if (file.name.endsWith('.json')) {
        rules = parseRulesFromJson(content);
      } else if (file.name.endsWith('.md')) {
        rules = parseRulesFromMarkdown(content);
      } else {
        try {
          rules = parseRulesFromJson(content);
        } catch {
          rules = parseRulesFromMarkdown(content);
        }
      }

      for (const rule of rules) {
        addExtractionRule(rule);
      }

      if (rules.length > 0) {
        alert(`成功导入 ${rules.length} 条提取规则`);
      } else {
        alert('未找到有效的提取规则');
      }
    } catch {
      alert('导入失败，请检查文件格式');
    }

    e.target.value = '';
  };

  const handleExport = () => {
    if (extractionRules.length === 0) {
      alert('没有可导出的提取规则');
      return;
    }

    const json = exportRulesToJson(extractionRules);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extraction_rules_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startEdit = (rule: ExtractionRule) => {
    setEditingRule(rule);
    setEditName(rule.name);
    setEditPath(rule.path);
    setEditSource(rule.source);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingRule(null);
    setEditName('');
    setEditPath('');
  };

  const saveEdit = () => {
    if (!editingRule || !editName.trim() || !editPath.trim()) return;

    updateExtractionRule(editingRule.id, {
      name: editName.trim(),
      path: editPath.trim(),
      source: editSource,
    });

    cancelEdit();
  };

  return (
    <div className="rounded-xl border border-zinc-600 bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-600 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-200">变量与规则</h3>
          {extractionRules.length > 0 && (
            <span className="text-[10px] text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded">{extractionRules.length} 条规则</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleImport}
            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700/60 hover:text-zinc-300"
            title="导入规则"
          >
            <Upload className="h-3 w-3" />
            导入
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700/60 hover:text-zinc-300"
            title="导出规则"
          >
            <Download className="h-3 w-3" />
            导出
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="max-h-40 overflow-auto p-2 border-b border-zinc-700">
        {vars.length === 0 ? (
          <div className="text-xs text-zinc-500 italic px-2 py-1">执行用例后，提取的变量值将显示在这里</div>
        ) : (
          <div className="space-y-1">
            {vars.map(([key, value]) => {
              const strValue = formatValue(value);
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
                    <div className="mt-1 font-mono text-xs text-zinc-400 break-all whitespace-pre-wrap">
                      {strValue}
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
        )}
        {vars.length > 0 && (
          <button
            onClick={clearExtractedVariables}
            className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded border border-zinc-700 bg-zinc-800/40 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700/60 hover:text-zinc-300"
          >
            <Trash2 className="h-3 w-3" />
            清空变量
          </button>
        )}
      </div>

      <div className="max-h-48 overflow-auto p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">提取规则</span>
        </div>
        {extractionRules.length === 0 ? (
          <div className="text-xs text-zinc-500 italic px-2 py-1">点击字段 + 号配置提取规则，或导入已有规则</div>
        ) : (
          <div className="space-y-1">
            {extractionRules.map((rule) => (
              <div
                key={rule.id}
                className="group flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 hover:border-zinc-700"
              >
                {isEditing && editingRule?.id === rule.id ? (
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-zinc-600"
                      placeholder="变量名"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editPath}
                      onChange={(e) => setEditPath(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-zinc-600"
                      placeholder="路径，如 data.token"
                    />
                    <div className="flex items-center gap-1">
                      <select
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value as 'body' | 'header')}
                        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none"
                      >
                        <option value="body">body</option>
                        <option value="header">header</option>
                      </select>
                      <button
                        onClick={saveEdit}
                        className="rounded p-1 text-emerald-400 hover:bg-zinc-800"
                        title="保存"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800"
                        title="取消"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-xs font-medium text-cyan-400">{rule.name}</span>
                        <span className="text-zinc-600">=</span>
                        <span className="font-mono text-xs text-zinc-500 break-all">{rule.path}</span>
                      </div>
                      {rule.description && (
                        <div className="mt-0.5 text-[10px] text-zinc-500">{rule.description}</div>
                      )}
                    </div>
                    {activeCaseId && (
                      <button
                        onClick={() => {
                          if (!activeCaseId) return;
                          const currentExtractors = activeOverride?.variableExtractors ?? activeCase?.variableExtractors ?? [];
                          const alreadyApplied = currentExtractors.some((e) => e.id === rule.id);
                          if (alreadyApplied) {
                            alert('该规则已应用到当前用例');
                            return;
                          }
                          updateCaseExtractors(activeCaseId, [...currentExtractors, {
                            id: rule.id,
                            name: rule.name,
                            source: rule.source,
                            path: rule.path,
                          }]);
                        }}
                        className="rounded bg-emerald-600/30 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-600/50 opacity-0 group-hover:opacity-100 transition"
                        title="应用到当前用例"
                      >
                        应用
                      </button>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => startEdit(rule)}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        title="编辑"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeExtractionRule(rule.id)}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                        title="删除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-700 px-4 py-2 bg-zinc-800/30">
        <div className="text-xs text-zinc-500">
          使用方式：在 Headers/Query/Body 中使用 <code className="text-cyan-400">$&#123;变量名&#125;</code> 引用
        </div>
      </div>
    </div>
  );
}
