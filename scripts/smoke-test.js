const baseUrl = (process.env.BASE_URL || process.argv[2] || 'http://127.0.0.1:3333').replace(/\/$/, '');
const checks = [];

async function request(path, expectedStatus = 200) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(120000) });
  const durationMs = Math.round(performance.now() - startedAt);
  if (response.status !== expectedStatus) {
    throw new Error(`${path}: HTTP ${response.status}; esperado ${expectedStatus}.`);
  }
  checks.push({ path, status: response.status, durationMs });
  return response;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const health = await (await request('/api/health')).json();
assert(health.status === 'ok', 'A API não está saudável.');
assert(health.database?.status === 'available', 'O banco não está disponível.');

const search = await (await request('/api/v1/search?q=Medicina&state=SP&limit=5')).json();
assert(search.pagination?.total > 0, 'A busca nacional não retornou resultados.');
assert(search.data.length > 0 && search.data.every((item) => item.location.state === 'SP'), 'O filtro de UF não foi respeitado.');
const first = search.data[0];

const filtered = await (await request('/api/v1/search?q=Medicina&state=SP&network=publica&modality=presencial&degree=bacharelado&organization=universidade&category=publica_estadual&free=sim&shift=diurno&dimension=municipio&minSeats=1&sort=seats&limit=5')).json();
assert(filtered.data.length > 0, 'A combinação completa de filtros não retornou resultados.');
assert(filtered.data.every((item) => item.location.state === 'SP'
  && item.institution.network === 'publica'
  && item.institution.academicOrganization === 'Universidade'
  && item.institution.administrativeCategory === 'Pública Estadual'
  && item.modality.value === 'presencial'
  && item.degree.value === 'bacharelado'
  && item.free.value === true
  && item.dimension.value === 'municipio'
  && item.shifts.value.daytimeSeats > 0
  && item.censusSeats.value >= 1), 'Um ou mais filtros avançados não foram respeitados.');

const nighttime = await (await request('/api/v1/search?shift=noturno&sort=seats&limit=5')).json();
assert(nighttime.data.length > 0 && nighttime.data.every((item) => item.shifts.value.nighttimeSeats > 0), 'O filtro de turno noturno não foi respeitado.');

const record = await (await request(`/api/v1/catalog-records/${first.id}`)).json();
assert(record.data?.id === first.id, 'O detalhe do registro diverge da busca.');
await request(`/api/v1/institutions/${first.institution.id}?page=1&limit=5`);

const docs = await (await request('/api/docs/openapi.json')).json();
assert(docs.openapi && docs.paths?.['/search'], 'O contrato OpenAPI está incompleto.');

const robots = await (await request('/robots.txt')).text();
assert(robots.includes('Sitemap:'), 'robots.txt não referencia o sitemap.');
const sitemapIndex = await (await request('/sitemap.xml')).text();
assert(sitemapIndex.includes('<sitemapindex') && sitemapIndex.includes('/sitemaps/records-1.xml'), 'Índice de sitemaps inválido.');
const sitemapCore = await (await request('/sitemaps/core.xml')).text();
assert(sitemapCore.includes('<urlset') && sitemapCore.includes('/privacidade'), 'Sitemap principal inválido.');
const sitemapRecords = await (await request('/sitemaps/records-1.xml')).text();
assert(sitemapRecords.includes('<urlset') && sitemapRecords.includes('/ofertas/'), 'Sitemap paginado de registros inválido.');

for (const path of ['/', '/buscar', '/enem', '/privacidade', '/termos', `/ofertas/${first.id}`]) {
  const html = await (await request(path)).text();
  assert(html.includes('<div id="root">'), `${path}: frontend React não foi entregue.`);
}
await request('/pagina-que-nao-existe-qa', 404);

console.table(checks);
console.log({ status: 'smoke test aprovado', baseUrl, checks: checks.length });
