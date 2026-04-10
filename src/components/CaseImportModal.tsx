import { useState, useRef } from 'react';
import { X, Upload, FileText, FileCode, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  isLoading: boolean;
}

type ImportFormat = 'spec' | 'markdown' | 'auto';

export default function CaseImportModal({ isOpen, onClose, onImport, isLoading }: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImportFormat>('auto');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    setSuccess(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['ts', 'spec.ts', 'md', 'markdown'].includes(ext || '')) {
        setError('仅支持 .spec.ts, .ts, .md, .markdown 格式的文件');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('请先选择文件');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await onImport(selectedFile);
      setSuccess('导入成功！');
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setSuccess(null);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'md' || ext === 'markdown') {
      return <FileText className="h-12 w-12 text-blue-400" />;
    }
    return <FileCode className="h-12 w-12 text-green-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-zinc-600 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-100">导入 Playwright 用例</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            className={cn(
              'relative rounded-xl border-2 border-dashed p-8 text-center transition-all',
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-zinc-600 hover:border-zinc-500',
              selectedFile ? 'border-emerald-500 bg-emerald-500/5' : '',
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".spec.ts,.ts,.md,.markdown"
              className="hidden"
              onChange={handleFileSelect}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                {getFileIcon(selectedFile.name)}
                <div className="text-sm font-medium text-zinc-200">{selectedFile.name}</div>
                <div className="text-xs text-zinc-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  重新选择
                </button>
              </div>
            ) : (
              <>
                <Upload className={cn('mx-auto h-12 w-12', dragActive ? 'text-indigo-400' : 'text-zinc-500')} />
                <div className="mt-4 text-sm text-zinc-300">
                  拖拽文件到此处，或{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    点击选择文件
                  </button>
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  支持 .spec.ts, .ts, .md, .markdown 格式
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">文件格式</label>
            <div className="flex gap-3">
              {[
                { value: 'auto', label: '自动识别' },
                { value: 'spec', label: 'Playwright Spec' },
                { value: 'markdown', label: 'Markdown' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition',
                    format === option.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={() => setFormat(option.value as ImportFormat)}
                    className="hidden"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-300">{success}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-700 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isLoading}
            className={cn(
              'rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition',
              selectedFile && !isLoading ? 'hover:bg-indigo-400' : 'opacity-50 cursor-not-allowed',
            )}
          >
            {isLoading ? '导入中...' : '导入'}
          </button>
        </div>
      </div>
    </div>
  );
}
