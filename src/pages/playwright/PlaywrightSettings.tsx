import { useState } from 'react';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlaywrightSettings() {
  const [browserType, setBrowserType] = useState<'chromium' | 'firefox' | 'webkit'>('chromium');
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const [slowMo, setSlowMo] = useState(0);
  const [defaultTimeout, setDefaultTimeout] = useState(5000);
  const [screenshotOnFailure, setScreenshotOnFailure] = useState(true);
  const [recordVideo, setRecordVideo] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="text-sm font-semibold text-zinc-100">Playwright 设置</div>
        <div className="mt-1 text-xs text-zinc-400">配置浏览器执行环境和默认行为</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-zinc-300 mb-2">浏览器类型</div>
            <div className="flex gap-3">
              {(['chromium', 'firefox', 'webkit'] as const).map((browser) => (
                <label
                  key={browser}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition',
                    browserType === browser
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600',
                  )}
                >
                  <input
                    type="radio"
                    name="browser"
                    value={browser}
                    checked={browserType === browser}
                    onChange={() => setBrowserType(browser)}
                    className="hidden"
                  />
                  <span className="text-sm capitalize">{browser}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">Viewport 宽度</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={viewport.width}
                onChange={(e) => setViewport((v) => ({ ...v, width: Number(e.target.value) }))}
              />
            </label>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">Viewport 高度</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={viewport.height}
                onChange={(e) => setViewport((v) => ({ ...v, height: Number(e.target.value) }))}
              />
            </label>
          </div>

          <div>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-300">慢速模式延迟 (ms)</div>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                value={slowMo}
                onChange={(e) => setSlowMo(Number(e.target.value))}
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
                value={defaultTimeout}
                onChange={(e) => setDefaultTimeout(Number(e.target.value))}
                placeholder="5000"
              />
            </label>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-medium text-zinc-300 mb-2">截图与录制</div>
            <div className="flex gap-6">
              <Toggle
                label="失败时截图"
                checked={screenshotOnFailure}
                onChange={setScreenshotOnFailure}
              />
              <Toggle
                label="录制视频"
                checked={recordVideo}
                onChange={setRecordVideo}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400">
            <Save className="h-4 w-4" />
            保存设置
          </button>
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
