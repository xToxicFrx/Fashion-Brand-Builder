/**
 * Trigger a browser download of an image URL. Fetches the bytes and saves them
 * via a blob so cross-origin images (e.g. Supabase Storage) download as a file
 * instead of navigating. Falls back to opening the URL in a new tab if the
 * fetch is blocked (CORS) so the user can still save it manually.
 */
export async function downloadImage(
  url: string,
  filename = 'mockup.png',
): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}
