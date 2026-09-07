const DEFAULT_UPSTREAM = 'https://faculdade-perto.onrender.com';

function upstreamOrigin(env) {
  const configured = env.UPSTREAM_API_ORIGIN || DEFAULT_UPSTREAM;
  return configured.replace(/\/$/, '');
}

// Mantém o navegador no mesmo domínio do Pages: cookies de sessão continuam
// HttpOnly/Secure e não exigem CORS no cliente. O Worker não interpreta nem
// registra dados do usuário; ele apenas encaminha a API existente.
export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = new URL(`${upstreamOrigin(context.env)}${incoming.pathname}${incoming.search}`);
  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));
  headers.set('x-forwarded-host', incoming.host);

  const visitorIp = context.request.headers.get('cf-connecting-ip');
  if (visitorIp) headers.set('x-forwarded-for', visitorIp);

  try {
    const upstream = await fetch(target, {
      method: context.request.method,
      headers,
      body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
      redirect: 'manual'
    });
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('access-control-allow-origin');
    responseHeaders.delete('access-control-allow-credentials');
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
  } catch {
    return Response.json({ error: { code: 'API_INDISPONIVEL', message: 'O serviço está temporariamente indisponível.', hint: 'Tente novamente em alguns instantes.' } }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
