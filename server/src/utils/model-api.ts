export type ApiFormat = 'openai' | 'deepseek' | 'zhipu' | 'auto';

export async function detectApiFormat(baseUrl: string): Promise<ApiFormat> {
  try {
    const r = await fetch(`${baseUrl}/v1/models`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (r.ok) return 'openai';
  } catch (e) {
    // continue to next format
  }
  try {
    const r = await fetch(`${baseUrl}/api/models`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (r.ok) return 'deepseek';
  } catch (e) {
    // continue to next format
  }
  return 'auto';
}

export async function fetchModelList(baseUrl: string, apiKey: string, format: ApiFormat) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  if (format === 'openai' || format === 'auto') {
    try {
      const res = await fetch(`${baseUrl}/v1/models`, { headers });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map((m: any) => ({ id: m.id, name: m.name || m.id }));
        if (models.length > 0) return { models };
      }
    } catch (e) {
      // continue to next format
    }
  }
  if (format === 'deepseek' || format === 'auto') {
    try {
      const res = await fetch(`${baseUrl}/api/models`, { headers });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || data.models || []).map((m: any) => ({ id: m.id, name: m.name || m.id }));
        if (models.length > 0) return { models };
      }
    } catch (e) {
      // continue to next format
    }
  }
  return { models: [] };
}
