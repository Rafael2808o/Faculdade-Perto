const DEFAULT_UPSTREAM = 'https://faculdade-perto.onrender.com';

export async function onRequestGet(context) {
  const upstream = (context.env.UPSTREAM_API_ORIGIN || DEFAULT_UPSTREAM).replace(/\/$/, '');
  const response = await fetch(`${upstream}/sitemap.xml`, {
    headers: { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
