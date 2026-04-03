import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useRunnerStore } from '@/hooks/useRunnerStore';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { settings, loadSettings, saveSettings, setSettings, error } = useRunnerStore();
  const [local, setLocal] = useState(settings);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="text-sm font-semibold text-zinc-100">运行设置</div>
        <div className="mt-1 text-xs text-zinc-400">配置 Base URL、超时、并发与登录凭证（仅保存在本机 data/settings.json）</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Base URL" value={local.baseUrl} onChange={(v) => setLocal((s) => ({ ...s, baseUrl: v }))} placeholder="http://127.0.0.1:8999" />
          <Field label="超时（ms）" value={String(local.timeoutMs)} onChange={(v) => setLocal((s) => ({ ...s, timeoutMs: Number(v || 0) }))} placeholder="15000" />
          <Field label="并发（1~10）" value={String(local.concurrency)} onChange={(v) => setLocal((s) => ({ ...s, concurrency: Number(v || 1) }))} placeholder="1" />
          <Toggle label="失败继续" description="失败用例出现时是否停止队列" checked={local.continueOnFail} onChange={(checked) => setLocal((s) => ({ ...s, continueOnFail: checked }))} />
          <Toggle label="启用变量替换" description="将用例中的 {{auth.email}} 和 {{auth.password}} 替换为设置中的管理员邮箱和密码" checked={local.enableVariableReplace} onChange={(checked) => setLocal((s) => ({ ...s, enableVariableReplace: checked }))} />
          <Field label="管理员邮箱" value={local.authEmail} onChange={(v) => setLocal((s) => ({ ...s, authEmail: v }))} placeholder="admin@admin.com" />
          <Field label="管理员密码" value={local.authPassword} onChange={(v) => setLocal((s) => ({ ...s, authPassword: v }))} placeholder="admin123" />
          <Field label="MFA Code（可选）" value={local.mfaCode} onChange={(v) => setLocal((s) => ({ ...s, mfaCode: v }))} placeholder="" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            onClick={async () => {
              setSettings(local);
              await saveSettings(local);
            }}
          >
            <Save className="h-4 w-4" />
            保存
          </button>
          {error ? <div className="text-sm text-rose-300">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <div className="text-xs font-medium text-zinc-300">{label}</div>
      <input
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-end justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/20 px-3 py-2">
      <div>
        <div className="text-xs font-medium text-zinc-300">{label}</div>
        {description ? <div className="mt-1 text-xs text-zinc-500">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn(
          'h-6 w-11 rounded-full border border-zinc-700 p-0.5 transition',
          checked ? 'bg-emerald-500/30' : 'bg-zinc-900/40',
        )}
        onClick={() => onChange(!checked)}
      >
        <div
          className={cn(
            'h-5 w-5 rounded-full bg-zinc-200 transition',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  );
}
