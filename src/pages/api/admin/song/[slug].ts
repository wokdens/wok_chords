import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { validateSession } from '../../../../lib/admin-auth';
import { SONGS_DIR } from '../list';

export const GET: APIRoute = async ({ params, request }) => {
  if (!validateSession(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const slug = String(params.slug ?? '');
  const safe = slug.replace(/[^a-z0-9_-]/gi, '');
  const file = `${safe}.chopro`;
  const p = path.join(SONGS_DIR, file);
  if (!fs.existsSync(p)) {
    return new Response(JSON.stringify({ ok: false, error: 'Song not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const raw = fs.readFileSync(p, 'utf8');
  const stat = fs.statSync(p);
  return new Response(
    JSON.stringify({
      ok: true,
      slug: safe,
      file,
      raw,
      mtime: stat.mtime.toISOString(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

export const PUT: APIRoute = async ({ params, request }) => {
  if (!validateSession(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const slug = String(params.slug ?? '');
  const safe = slug.replace(/[^a-z0-9_-]/gi, '');
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const raw = typeof body?.raw === 'string' ? body.raw : '';
  if (!raw.trim()) {
    return new Response(JSON.stringify({ ok: false, error: 'Empty content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const file = `${safe}.chopro`;
  const p = path.join(SONGS_DIR, file);
  if (!fs.existsSync(p)) {
    return new Response(JSON.stringify({ ok: false, error: 'Song not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const normalized = raw.endsWith('\n') ? raw : raw + '\n';
  fs.writeFileSync(p, normalized, 'utf8');
  const stat = fs.statSync(p);
  return new Response(
    JSON.stringify({
      ok: true,
      file,
      size: normalized.length,
      mtime: stat.mtime.toISOString(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
