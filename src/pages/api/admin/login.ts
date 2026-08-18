import type { APIRoute } from 'astro';
import {
  COOKIE_NAME,
  checkPassword,
  createSession,
  SESSION_TTL_MS,
  DEFAULT_PASSWORD,
  getPassword,
} from '../../../lib/admin-auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  const pw = typeof body?.password === 'string' ? body.password : '';
  if (!checkPassword(pw)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Incorrect password.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const session = createSession();
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  cookies.set(COOKIE_NAME, session, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  const usingDefault = getPassword() === DEFAULT_PASSWORD;
  return new Response(
    JSON.stringify({ ok: true, usingDefault }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
