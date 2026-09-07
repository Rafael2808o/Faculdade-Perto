const DEFAULT_UPSTREAM = 'https://faculdade-perto.onrender.com';

const PUBLIC_CACHE_TTL_SECONDS = 15 * 60;
const PUBLIC_CATALOG_PATH = /^\/api\/v1\/(?:institutions|courses|municipalities|offerings|catalog-records|search|cutoffs|admission-history|sitemap-data)(?:\/|$)/;

function upstreamOrigin(env) {
  const configured = env.UPSTREAM_API_ORIGIN || DEFAULT_UPSTREAM;
  return configured.replace(/\/$/, '');
}

function isPublicCatalogRequest(request, pathname) {
  return request.method === 'GET'
    && !request.headers.has('cookie')
    && PUBLIC_CATALOG_PATH.test(pathname);
}

function withCacheHeader(response, cacheStatus) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, max-age=${PUBLIC_CACHE_TTL_SECONDS}, s-maxage=${PUBLIC_CACHE_TTL_SECONDS}`);
  headers.set('X-Faculdade-Perto-Cache', cacheStatus);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Mantém o navegador no mesmo domínio do Pages: cookies de sessão continuam
// HttpOnly/Secure e não exigem CORS no cliente. O Worker não interpreta nem
// registra dados do usuário; ele apenas encaminha a API existente.
export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = new URL(`${upstreamOrigin(context.env)}${incoming.pathname}${incoming.search}`);
  const shouldCache = isPublicCatalogRequest(context.request, incoming.pathname);
  const edgeCache = caches.default;

  if (shouldCache) {
    const cached = await edgeCache.match(context.request);
    if (cached) return withCacheHeader(cached, 'HIT');
  }

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
    const response = new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });

    if (shouldCache && response.ok) {
      const cacheable = withCacheHeader(response, 'MISS');
      context.waitUntil(edgeCache.put(context.request, cacheable.clone()));
      return cacheable;
    }

    return response;
  } catch {
    return Response.json({ error: { code: 'API_INDISPONIVEL', message: 'O serviço está temporariamente indisponível.', hint: 'Tente novamente em alguns instantes.' } }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
