/** True if the URL is a Google Maps embed `src` (safe for iframe). */
export function isGoogleMapsEmbedUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith('https://')) return false;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');
    return host === 'google.com' && u.pathname.includes('/maps/embed');
  } catch {
    return false;
  }
}
