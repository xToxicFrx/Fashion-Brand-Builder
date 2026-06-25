import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

const MAX_BYTES = 6_000_000; // ~6 MB

/**
 * Dev image upload: accepts a base64 data URL and writes it to /public/uploads,
 * returning a public path. In production, swap this for UploadThing / S3 / Supabase
 * Storage (see README) — the client contract (POST { dataUrl } -> { url }) stays the same.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dataUrl, filename } = (await request.json()) as {
      dataUrl?: string;
      filename?: string;
    };

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
    }

    const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: 'Expected a base64 image data URL' },
        { status: 400 },
      );
    }

    const mime = match[1];
    const ext = mime.split('/')[1].replace('+xml', '').replace('jpeg', 'jpg');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    const stem =
      slugify((filename ?? '').replace(/\.[^.]+$/, '')) || 'design';
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${stem}.${ext}`;

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buffer);

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (error) {
    console.error('[api/upload]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
