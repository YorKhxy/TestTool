export async function apiJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new Error(`接口返回非JSON：${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    let msg: string | null = null;
    if (json && typeof json === 'object' && !Array.isArray(json) && 'error' in json) {
      const v = (json as Record<string, unknown>).error;
      if (typeof v === 'string') msg = v;
    }
    throw new Error(msg ?? `HTTP ${res.status}`);
  }
  return json as T;
}

export function safeParseJsonObject(text: string): { ok: true; value: Record<string, string> } | { ok: false; error: string } {
  const t = text.trim();
  if (!t) return { ok: true as const, value: {} };
  try {
    const v = JSON.parse(t);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false as const, error: '需要一个JSON对象' };
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) {
      if (typeof val === 'string') out[k] = val;
      else out[k] = JSON.stringify(val);
    }
    return { ok: true as const, value: out };
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'JSON解析失败' };
  }
}

export function safeParseJsonAny(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const t = text.trim();
  if (!t) return { ok: true as const, value: undefined };
  try {
    return { ok: true as const, value: JSON.parse(t) };
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'JSON解析失败' };
  }
}
