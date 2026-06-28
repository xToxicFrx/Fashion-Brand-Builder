import { randomUUID } from 'crypto';

/**
 * Persist remote images into Supabase Storage so they get a permanent public
 * URL. OpenAI image URLs (dall-e-3) are temporary and expire after ~1-2 hours;
 * uploading the bytes to our own bucket means a saved mockup keeps working
 * forever. Uses the Storage REST API directly (no extra dependency) and only
 * ever runs server-side, so the service-role key is never exposed to clients.
 *
 * Configure with:
 *   SUPABASE_URL              e.g. https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY service-role key (server-side only)
 *   SUPABASE_STORAGE_BUCKET   optional, defaults to "mockups"
 *
 * When Storage isn't configured (or anything fails), helpers fall back to the
 * original URL so the app keeps working exactly as before.
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'mockups';

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY as string,
  };
}

// Creating the bucket is idempotent and only needs to succeed once per process.
let bucketEnsured = false;

/** Lazily create the (public) storage bucket; tolerate "already exists". */
async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok || res.status === 409) {
    bucketEnsured = true;
    return;
  }
  const text = await res.text();
  if (/exist/i.test(text)) {
    bucketEnsured = true;
    return;
  }
  throw new Error(`Could not ensure storage bucket: ${res.status} ${text}`);
}

function extensionFor(contentType: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  return 'png';
}

function publicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Upload raw image bytes to the bucket and return their permanent public URL. */
async function uploadBytes(
  bytes: Buffer,
  contentType: string,
  prefix?: string,
): Promise<string> {
  await ensureBucket();
  const folder = (prefix ? `${prefix.replace(/^\/+|\/+$/g, '')}/` : '') + 'mockups';
  const path = `${folder}/${randomUUID()}.${extensionFor(contentType)}`;
  const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: new Uint8Array(bytes),
  });
  if (!upRes.ok) {
    throw new Error(`Upload failed: ${upRes.status} ${await upRes.text()}`);
  }
  return publicUrl(path);
}

/**
 * Download an image from a (possibly temporary) URL and upload it to Supabase
 * Storage, returning a permanent public URL. If Storage isn't configured — or
 * download/upload fails — returns the original URL so the caller still works.
 *
 * @param sourceUrl the image URL to copy (e.g. a dall-e-3 result)
 * @param prefix    optional folder prefix inside the bucket (e.g. the user id)
 */
export async function persistImageFromUrl(
  sourceUrl: string,
  prefix?: string,
): Promise<string> {
  if (!isSupabaseStorageConfigured()) return sourceUrl;
  try {
    const imgRes = await fetch(sourceUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download source image: ${imgRes.status}`);
    }
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    return await uploadBytes(bytes, contentType, prefix);
  } catch (error) {
    console.error(
      '[storage] persistImageFromUrl failed; falling back to source URL:',
      error,
    );
    return sourceUrl;
  }
}

/**
 * Persist a base64-encoded image (e.g. from gpt-image-1, which always returns
 * b64 rather than a URL) into Supabase Storage and return a permanent public
 * URL. When Storage isn't configured the image is returned as an inline data:
 * URL so it still renders — note data URLs are too large to save to the
 * database, so permanent saving requires Storage to be configured.
 *
 * @param b64    the base64 image payload (without the data: prefix)
 * @param prefix optional folder prefix inside the bucket (e.g. the user id)
 */
export async function persistImageFromBase64(
  b64: string,
  prefix?: string,
  contentType = 'image/png',
): Promise<string> {
  if (!isSupabaseStorageConfigured()) {
    return `data:${contentType};base64,${b64}`;
  }
  try {
    const bytes = Buffer.from(b64, 'base64');
    return await uploadBytes(bytes, contentType, prefix);
  } catch (error) {
    console.error(
      '[storage] persistImageFromBase64 failed; falling back to data URL:',
      error,
    );
    return `data:${contentType};base64,${b64}`;
  }
}
