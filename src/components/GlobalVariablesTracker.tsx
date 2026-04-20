import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Copy, CheckCircle, Trash2, Search, Upload, Download, ArrowRight, Edit2, X } from 'lucide-react';
import type { CaseExtractionResult, ExtractionRule, CaseOverride } from '../hooks/useRunnerStore';
import { cn } from '@/lib/utils';

interface GlobalVariablesTrackerProps {
  extractedVariables: Record<string, unknown>;
  caseExtractionResults: Record<string, CaseExtractionResult>;
  caseNames?: Record<string, string>;
  overrides?: Record<string, CaseOverride>;
  extractionRules: ExtractionRule[];
  activeCaseId?: string;
  onClearAll?: () => void;
  onAddRule?: (rule: ExtractionRule) => void;
  onRemoveRule?: (ruleId: string) => void;
  onUpdateRule?: (ruleId: string, patch: Partial<Omit<ExtractionRule, 'id'>>) => void;
  onApplyRule?: (caseId: string, rule: ExtractionRule) => void;
  onImportRules?: () => void;
  onExportRules?: () => void;
}

const VAR_PATTERN = /\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g;

export default function GlobalVariablesTracker({
  extractedVariables,
  caseExtractionResults,
  caseNames = {},
  overrides = {},
  extractionRules,
  activeCaseId,
  onClearAll,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  onApplyRule,
  onImportRules,
  onExportRules,
}: GlobalVariablesTrackerProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'variables' | 'rules'>('variables');
  const [expandedVar, setExpandedVar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState<ExtractionRule | null>(null);
  const [editName, setEditName] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editSource, setEditSource] = useState<'body' | 'header'>('body');

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
    if (!editingRule || !editName.trim() || !editPath.trim() || !onUpdateRule) return;
    onUpdateRule(editingRule.id, { name: editName.trim(), path: editPath.trim(), source: editSource });
    cancelEdit();
  };

  const allVariables = useMemo(() => {
    const vars = new Set<string>();
    Object.keys(extractedVariables).forEach((v) => vars.add(v));
    Object.values(caseExtractionResults).forEach((result) => {
      result.extractionResults.forEach((e) => vars.add(e.variableName));
    });
    Object.values(overrides).forEach((override) => {
      const text = [override.path, override.headersText, override.queryText, override.bodyText, override.expectedResult].filter(Boolean).join(' ');
      let match;
      while ((match = VAR_PATTERN.exec(text)) !== null) {
        vars.add(match[1]);
      }
      VAR_PATTERN.lastIndex = 0;
    });
    return Array.from(vars).sort();
  }, [extractedVariables, caseExtractionResults, overrides]);

  const variableUsage = useMemo(() => {
    const usage: Record<string, Array<{
      caseId: string;
      caseName: string;
      field: 'path' | 'headers' | 'query' | 'body' | 'expectedResult';
      defined: boolean;
    }>> = {};

    for (const varName of allVariables) {
      usage[varName] = [];
    }

    for (const [caseId, override] of Object.entries(overrides)) {
      const fields: Array<{ field: 'path' | 'headers' | 'query' | 'body' | 'expectedResult'; text: string }> = [
        { field: 'path', text: override.path ?? '' },
        { field: 'headers', text: override.headersText ?? '' },
        { field: 'query', text: override.queryText ?? '' },
        { field: 'body', text: override.bodyText ?? '' },
        { field: 'expectedResult', text: override.expectedResult ?? '' },
      ];

      for (const { field, text } of fields) {
        let match;
        const localPattern = new RegExp(VAR_PATTERN);
        while ((match = localPattern.exec(text)) !== null) {
          const varName = match[1];
          if (usage[varName]) {
            usage[varName].push({
              caseId,
              caseName: caseNames[caseId] || caseId,
              field,
              defined: varName in extractedVariables,
            });
          }
        }
        localPattern.lastIndex = 0;
      }
    }

    return usage;
  }, [allVariables, overrides, caseNames, extractedVariables]);

  const filteredVariables = useMemo(() => {
    if (!searchText) return allVariables;
    const lower = searchText.toLowerCase();
    return allVariables.filter((name) => name.toLowerCase().includes(lower));
  }, [allVariables, searchText]);

  const displayedVariables = useMemo(() => {
    if (selectedCase === 'all') return filteredVariables;
    return filteredVariables.filter((varName) =>
      variableUsage[varName]?.some((u) => u.caseId === selectedCase)
    );
  }, [filteredVariables, selectedCase, variableUsage]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (key: string, value: unknown) => {
    try {
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await navigator.clipboard.writeText(strValue);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      void 0;
    }
  };

  const uniqueCaseIds = useMemo(() => {
    return Array.from(new Set(
      Object.keys(caseExtractionResults).concat(Object.keys(overrides))
    ));
  }, [caseExtractionResults, overrides]);

  const fieldLabels: Record<string, string> = {
    path: '路径',
    headers: 'Headers',
    query: 'Query',
    body: 'Body',
    expectedResult: '预期',
  };

  return (
    <div className="rounded-xl border border-zinc-600 bg-zinc-900">
      <div className="flex items-center border-b border-zinc-600">
        <button
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800/30 transition flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>变量追踪</span>
          <span className="ml-2 rounded bg-cyan-900/50 px-1.5 py-0.5 text-xs text-cyan-300">
            {allVariables.length}
          </span>
        </button>
        <div className="flex border-l border-zinc-600">
          <button
            className={cn('px-3 py-2 text-xs font-medium transition', activeTab === 'variables' ? 'text-cyan-300 bg-zinc-800/50' : 'text-zinc-400 hover:text-zinc-200')}
            onClick={() => setActiveTab('variables')}
          >
            变量
          </button>
          <button
            className={cn('px-3 py-2 text-xs font-medium transition', activeTab === 'rules' ? 'text-emerald-300 bg-zinc-800/50' : 'text-zinc-400 hover:text-zinc-200')}
            onClick={() => setActiveTab('rules')}
          >
            规则
            {extractionRules.length > 0 && <span className="ml-1 rounded bg-emerald-900/50 px-1 text-[10px]">{extractionRules.length}</span>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-600">
          <div className="flex items-center gap-2 p-3 border-b border-zinc-700/50">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="搜索变量..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 py-1 pl-7 pr-2 text-xs text-zinc-100 outline-none focus:border-zinc-600"
              />
            </div>
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-950 py-1 px-2 text-xs text-zinc-100 outline-none"
            >
              <option value="all">全部用例</option>
              {uniqueCaseIds.map((caseId) => (
                <option key={caseId} value={caseId}>
                  {caseNames[caseId] || caseId}
                </option>
              ))}
            </select>
            {activeTab === 'variables' && onClearAll && allVariables.length > 0 && (
              <button
                onClick={onClearAll}
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                title="清空所有变量"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-auto">
            {activeTab === 'variables' ? (
              displayedVariables.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  {searchText ? '没有匹配的变量' : '暂无变量数据'}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {displayedVariables.map((varName) => {
                    const value = extractedVariables[varName];
                    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
                    const isCopied = copiedKey === varName;
                    const usages = variableUsage[varName] ?? [];
                    const usedInCases = new Set(usages.map((u) => u.caseId));
                    const isExpanded = expandedVar === varName;

                    const extractionFrom = Object.entries(caseExtractionResults)
                      .filter(([, result]) => result.extractionResults.some((e) => e.variableName === varName && e.success))
                      .map(([caseId]) => caseId);

                    return (
                      <div key={varName} className="rounded-lg border border-zinc-800 bg-zinc-950/40">
                        <div
                          className="flex items-start gap-2 p-2 cursor-pointer hover:bg-zinc-800/30 transition"
                          onClick={() => setExpandedVar(isExpanded ? null : varName)}
                        >
                          <div className="mt-0.5 text-zinc-500">
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-cyan-400">${varName}</span>
                              {value !== undefined && (
                                <>
                                  <span className="text-zinc-600 text-xs">=</span>
                                  <span className="truncate font-mono text-xs text-zinc-400 max-w-[150px]">{strValue}</span>
                                </>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                              {extractionFrom.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-900/30 px-1.5 py-0.5 text-emerald-400" title="提取自">
                                  <span>提取:</span>
                                  {extractionFrom.slice(0, 2).map((cid) => (
                                    <span key={cid}>{cid}</span>
                                  ))}
                                  {extractionFrom.length > 2 && <span>...</span>}
                                </span>
                              )}
                              {usages.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-blue-900/30 px-1.5 py-0.5 text-blue-400" title="使用于">
                                  <ArrowRight className="h-2.5 w-2.5" />
                                  <span>{usages.length} 处</span>
                                </span>
                              )}
                              {!value && usages.length === 0 && (
                                <span className="text-zinc-600 italic">未定义</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(varName, value); }}
                            className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                            title="复制值"
                          >
                            {isCopied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>

                        {isExpanded && usages.length > 0 && (
                          <div className="border-t border-zinc-800 px-4 py-2 space-y-1 bg-zinc-900/30">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">使用详情</div>
                            {usages.map((u, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <ArrowRight className="h-2.5 w-2.5 text-zinc-600 shrink-0" />
                                <span className="text-zinc-400">{u.caseName}</span>
                                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">{u.caseId}</span>
                                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">{fieldLabels[u.field]}</span>
                                {u.defined ? (
                                  <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                                ) : (
                                  <span className="text-[10px] text-rose-400">未定义</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">提取规则库 ({extractionRules.length})</span>
                  <div className="flex gap-1">
                    {onImportRules && (
                      <button onClick={onImportRules} className="rounded border border-zinc-700 bg-zinc-800/40 px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200" title="导入">
                        <Upload className="h-3 w-3" />
                      </button>
                    )}
                    {onExportRules && (
                      <button onClick={onExportRules} className="rounded border border-zinc-700 bg-zinc-800/40 px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200" title="导出">
                        <Download className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {extractionRules.length === 0 ? (
                  <div className="py-4 text-center">
                    <div className="text-xs text-zinc-600 italic mb-2">暂无提取规则</div>
                    {onImportRules && (
                      <button onClick={onImportRules} className="rounded border border-indigo-600 bg-indigo-900/30 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-900/50">
                        <Upload className="h-3 w-3 inline mr-1" />导入规则文件
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {extractionRules.map((rule) => {
                      const isApplied = activeCaseId ? caseExtractionResults[activeCaseId]?.appliedRules.some((r) => r.ruleId === rule.id) : false;
                      if (isEditing && editingRule?.id === rule.id) {
                        return (
                          <div key={rule.id} className="space-y-1 rounded bg-zinc-900/60 p-2">
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none" placeholder="变量名" autoFocus />
                            <input type="text" value={editPath} onChange={(e) => setEditPath(e.target.value)}
                              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none" placeholder="路径" />
                            <div className="flex items-center gap-1">
                              <select value={editSource} onChange={(e) => setEditSource(e.target.value as 'body' | 'header')}
                                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none">
                                <option value="body">body</option>
                                <option value="header">header</option>
                              </select>
                              <button onClick={saveEdit} className="rounded p-1 text-emerald-400 hover:bg-zinc-800"><CheckCircle className="h-3 w-3" /></button>
                              <button onClick={cancelEdit} className="rounded p-1 text-zinc-400 hover:bg-zinc-800"><X className="h-3 w-3" /></button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={rule.id} className="group flex items-center justify-between gap-2 rounded bg-zinc-900/60 px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-cyan-400">{rule.name}</span>
                              <span className="text-zinc-600 text-xs">=</span>
                              <span className="font-mono text-xs text-zinc-500 truncate">{rule.path}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            {activeCaseId && onApplyRule && !isApplied && (
                              <button onClick={() => onApplyRule(activeCaseId, rule)}
                                className="rounded bg-emerald-600/30 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-600/50">应用</button>
                            )}
                            {isApplied && <span className="rounded bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-400">已应用</span>}
                            {onUpdateRule && (
                              <button onClick={() => startEdit(rule)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Edit2 className="h-3 w-3" /></button>
                            )}
                            {onRemoveRule && (
                              <button onClick={() => onRemoveRule(rule.id)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 border-t border-zinc-700/50 pt-3">
                  <div className="text-xs text-zinc-500">
                    使用方式：在 Headers/Query/Body 中使用 <code className="text-cyan-400">$&#123;变量名&#125;</code> 引用
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
