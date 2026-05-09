export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return new Response(JSON.stringify({ error: 'SITE_PASSWORD not configured in Vercel.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { password } = body;

  if (!password || password !== sitePassword) {
    // Small delay to slow brute-force attempts
    await new Promise(r => setTimeout(r, 600));
    return new Response(JSON.stringify({ error: 'Incorrect password.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Token = base64(authenticated:SITE_PASSWORD) — stateless, server can verify any time
  const token = btoa('authenticated:' + sitePassword);

  return new Response(JSON.stringify({ token }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
