import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaywrightStore } from '@/hooks/usePlaywrightStore';

export default function PlaywrightSettings() {
  const { settings, setSettings, saveSettings, loadSettings } = usePlaywrightStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    await saveSettings(settings);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="text-sm font-semibold text-zinc-100">Playwright 设置</div>
        <div className="mt-1 text-xs text-zinc-400">配置浏览器执行环境和默认行为</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-zinc-300">启用自定义 BaseURL</div>
              <button
                type="button"
                onClick={() => setSettings({ baseURLEnabled: !settings.baseURLEnabled })}
                className={cn(
                  'h-6 w-11 rounded-full border border-zinc-700 p-0.5 transition',
                  settings.baseURLEnabled ? 'bg-emerald-500/30' : 'bg-zinc-900/40',
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-zinc-200 transition',
                    settings.baseURLEnabled ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
            {settings.baseURLEnabled && (
              <div className="mt-3">
                <label className="grid gap-1">
                  <div className="text-xs font-medium text-zinc-300">目标 BaseURL</div>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                    value={settings.baseURL}
                    onChange={(e) => setSettings({ baseURL: e.target.value })}
                    placeholder="http://localhost:3000"
                  />
                </label>
                <div className="mt-1 text-xs text-zinc-500">用例中相对路径将基于此地址解析</div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-xs font-medium text-zinc-300">使用用例内嵌 URL</div>
                <div className="text-xs text-zinc-500 mt-0.5">执行时优先使用用例中定义的完整 URL</div>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ useCaseUrl: !settings.useCaseUrl })}
                className={cn(
                  'h-6 w-11 rounded-full border border-zinc-700 p-0.5 transition',
                  settings.useCaseUrl ? 'bg-emerald-500/30' : 'bg-zinc-900/40',
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-zinc-200 transition',
                    settings.useCaseUrl ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-medium text-zinc-300 mb-3">浏览器类型</div>
            <div className="flex gap-3">
              {(['chromium', 'firefox', 'webkit'] as const).map((browser) => (
                <label
                  key={browser}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition',
                    settings.browser === browser
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  <input
                    type="radio"
                    name="browser"
                    value={browser}
                    checked={settings.browser === browser}
                    onChange={() => setSettings({ browser })}
                    className="hidden"
                  />
                  <span className="text-sm capitalize">{browser}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Toggle
              label="无头模式 (headless)"
              checked={settings.headless}
              onChange={(v) => setSettings({ headless: v })}
            />
            <div className="mt-1 text-xs text-zinc-500">关闭后可在窗口中看到浏览器执行过程</div>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">Viewport 宽度</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={settings.viewport.width}
                onChange={(e) => setSettings({ viewport: { ...settings.viewport, width: Number(e.target.value) } })}
              />
            </label>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">Viewport 高度</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={settings.viewport.height}
                onChange={(e) => setSettings({ viewport: { ...settings.viewport, height: Number(e.target.value) } })}
              />
            </label>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">慢速模式延迟 (ms)</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={settings.slowMo}
                onChange={(e) => setSettings({ slowMo: Number(e.target.value) })}
                placeholder="0"
              />
            </label>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">默认超时 (ms)</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={settings.timeout}
                onChange={(e) => setSettings({ timeout: Number(e.target.value) })}
                placeholder="5000"
              />
            </label>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-medium text-zinc-300 mb-3">截图与录制</div>
            <div className="flex gap-6">
              <Toggle
                label="失败时截图"
                checked={settings.screenshotOnFailure}
                onChange={(v) => setSettings({ screenshotOnFailure: v })}
              />
              <Toggle
                label="录制视频"
                checked={settings.recordVideo}
                onChange={(v) => setSettings({ recordVideo: v })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存设置'}
          </button>
          {saveSuccess && (
            <span className="text-sm text-emerald-400">保存成功</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="text-sm text-zinc-300">{label}</div>
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
