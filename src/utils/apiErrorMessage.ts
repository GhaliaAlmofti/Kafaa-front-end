/**
 * Turn Django REST / JSON error bodies into a single user-facing string.
 * Avoids showing raw `{"detail":"..."}` in the UI.
 */
export function formatApiErrorBody(data: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (data == null || data === '') return fallback;

  if (typeof data === 'string') {
    const t = data.trim();
    if (!t) return fallback;
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return formatApiErrorBody(JSON.parse(t) as unknown, fallback);
      } catch {
        return t;
      }
    }
    return t;
  }

  if (typeof data !== 'object') return String(data);

  const o = data as Record<string, unknown>;

  if (typeof o.detail === 'string' && o.detail.trim()) return o.detail.trim();

  if (Array.isArray(o.detail)) {
    const parts = o.detail
      .map((x) => (typeof x === 'string' ? x : String(x)))
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }

  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();

  if (Array.isArray(o.non_field_errors)) {
    const parts = o.non_field_errors.map(String).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }

  const fieldParts: string[] = [];
  for (const [key, val] of Object.entries(o)) {
    if (key === 'detail' || key === 'message' || key === 'non_field_errors') continue;
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (typeof v === 'string' && v.trim()) fieldParts.push(v.trim());
      });
    } else if (typeof val === 'string' && val.trim()) {
      fieldParts.push(val.trim());
    }
  }
  if (fieldParts.length) return fieldParts.join(' ');

  return fallback;
}
