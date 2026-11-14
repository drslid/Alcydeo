export async function api<T = any>(type: string, fields: Record<string, unknown> = {}): Promise<T> {
  const result = await chrome.runtime.sendMessage({ type, ...fields });
  if (!result?.ok) throw new Error(result?.error ?? 'unknown');
  return result.data as T;
}
