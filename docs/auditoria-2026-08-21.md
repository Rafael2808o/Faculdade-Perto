# Auditoria independente — 21/08/2026

> **Atualização pós-auditoria:** os gates de carga nacional descritos abaixo foram concluídos no mesmo dia. O modo local agora é `database`; foram importadas 2.561 IES e 720.349 linhas de curso, com 223 campos preservados por registro, zero rejeições e coordenadas oficiais para todos os 3.551 municípios presentes. A solução deixou de materializar aproximadamente 139 milhões de métricas EAV. Consulte `docs/operacao-catalogo-nacional.md`. As limitações factuais de campus, polo, oferta atual, mensalidade e nota de corte permanecem por ausência dessas informações no Censo.

## Resumo executivo

**Pontuação no momento da auditoria: 5,5/10.** Este parágrafo registra o estado encontrado antes das correções pós-auditoria; os bloqueios de banco, carga, paginação e ordenação foram resolvidos conforme a atualização acima. SEO dinâmico ainda depende de JavaScript.

Legenda das evidências:

- **AUTOMATIZADO:** suíte Vitest/Supertest;
- **NAVEGADOR:** fluxo executado em Microsoft Edge headless via Playwright;
- **HTTP:** requisição real contra o servidor iniciado;
- **DADOS:** processamento integral dos CSVs oficiais, sem persistência;
- **CÓDIGO:** análise estática, não execução;
- **NÃO TESTADO:** bloqueado pelo ambiente.

## APROVADO

- **AUTOMATIZADO:** 33 testes aprovados: 29 de API e 4 de frontend.
- **NAVEGADOR:** home, busca, filtros, vazio, detalhe, instituição, cidade, Enem, conta, login, logout, Meu Plano, comparação, correção e fila administrativa.
- **NAVEGADOR:** desktop 1440×1000, tablet 768×1024 e mobile 390×844 sem overflow horizontal nas rotas verificadas.
- **NAVEGADOR:** mapa móvel, agrupamento de pontos e geolocalização simulada funcionaram; nenhuma falha de console nas sete rotas normais da build final.
- **HTTP:** paginação da API retorna páginas distintas; entradas inválidas retornam 4xx; Swagger UI e OpenAPI carregam.
- **AUTOMATIZADO/HTTP:** CORS não libera origem desconhecida; SQL injection testada virou texto de busca; usuário comum recebe 403 na administração; exclusão cruzada de plano recebe 404; logout revoga token; rajada recebe 429.
- **DADOS:** 84/84 colunas de IES e 223/223 de cursos coincidem entre documentação e CSV oficial.
- **DADOS:** 720.349 linhas processadas, 720.349 chaves naturais únicas, zero duplicatas e zero rejeições no mapeamento nuclear.
- **DADOS:** todas as 139.027.357 métricas `QT_*` presentes são numéricas; máximo de 193 métricas por linha.
- **DADOS/CÓDIGO:** mensalidade e nota de corte continuam `nao_confirmado`; campus não é criado; endpoint de ofertas não converte mais agregado em oferta.
- **HTTP:** modo demo agora é explícito no health e na interface; `robots.txt` bloqueia todo crawling e o sitemap fica vazio em demo.
- **BUILD:** build Vite aprovada, sem sourcemaps de produção; `npm audit --omit=dev` encontrou zero vulnerabilidades.

## CORRIGIDO

1. Evidência aceitava `javascript:` — agora apenas HTTP/HTTPS.
2. JSON malformado e corpo acima de 200 KB retornavam 500 — agora 400 e 413.
3. `ADMIN_EMAIL` permitia tomar privilégio por cadastro público — promoção automática removida.
4. Primeiro usuário de demo em `NODE_ENV=production` podia virar admin — agora começa como usuário comum.
5. Cadastro concorrente duplicado podia resultar em 500 ou duplicata no repositório demo — agora 201/409.
6. Atualização de correção e auditoria eram duas operações independentes — agora usam transação no repositório PostgreSQL.
7. A amostra era apresentada como catálogo nacional — banner, health, robots e sitemap corrigidos.
8. “SP” era enviado como cidade — agora gera `state=SP`.
9. Erro de cidade era exibido como lista vazia — estado de erro separado.
10. Registro/instituição inexistente não recebia metadata de erro — agora `noindex` e título próprio.
11. Rota HTML desconhecida retornava 200 em produção — agora retorna 404.
12. `/offerings/:id` devolvia registro agregado — agora consulta apenas oferta individual e retorna 404 quando ausente.
13. Importador inferia modalidade desconhecida como EAD e gratuidade ausente como falsa — agora rejeita modalidade e mantém gratuidade nula.
14. Métricas eram inseridas uma consulta por valor — agora cada curso usa inserção em lote com `unnest`.
15. Reexecução do importador acumulava rejeições antigas — rejeições e contadores são reiniciados.
16. Listas faziam join com todas as métricas — agora consultam somente `QT_VG_TOTAL` e `QT_MAT`.
17. Health check não verificava banco — em modo database executa `SELECT 1` e retorna 503 se indisponível.
18. Imagem Docker podia incorporar `.env`, executava como root e não tinha health check de app — `.dockerignore`, usuário `node` e health checks adicionados.
19. Vite publicava sourcemaps e um `robots.txt` com localhost — ambos removidos da build.
20. Export auxiliar quebrava Fast Refresh — helper movido para `lib`.

## PENDENTE

- Implementar paginação visível e ordenação da busca. A API pagina, mas o frontend fixa `limit=30` e não oferece próxima página.
- Definir arquitetura para 139 milhões de métricas: EAV atual, JSONB/wide table ou subconjunto versionado. Esta decisão afeta armazenamento, importação e consultas.
- Tornar cada linha importada atômica ou usar staging/COPY. Hoje falhas de banco após alguns upserts podem deixar projeções parciais.
- Otimizar busca nacional: `%ILIKE%` com `unaccent` pode não usar os índices trigram atuais; contagem/agrupamento ocorre antes do limite.
- Implementar SSR/prerender para SEO dinâmico. Sem JavaScript, curso e instituição entregam o mesmo HTML genérico, sem canonical/description específicos.
- Formalizar provisionamento e auditoria de perfis `reviewer/admin`; cadastro público agora é seguro, porém não existe CLI operacional.
- Fornecer fonte oficial de campus/coordenadas. Na importação nacional, municípios não recebem coordenadas e o raio atual é apenas visual.
- Definir backup, restauração, retenção de sessões/auditoria, observabilidade e logs de acesso.

## RISCO

- **Alto:** volume de 139.027.357 métricas e milhões de queries restantes tornam duração/espaço da carga nacional imprevisíveis.
- **Alto:** banco real, migrations e carga nacional não foram executados; erros SQL só podem ser descartados após esse ensaio.
- **Médio-alto:** SEO dinâmico client-side e IDs dinâmicos inexistentes ainda começam com HTTP 200 antes da API determinar ausência.
- **Médio:** bearer token fica em `localStorage`; CSP reduz superfície, mas um XSS no mesmo origin poderia exfiltrá-lo.
- **Médio:** rate limit usa memória do processo e não é compartilhado entre réplicas.
- **Médio:** não há verificação de e-mail, recuperação de senha ou política operacional de administração.
- **Médio:** dependências têm novas versões major disponíveis; não foram atualizadas para evitar migração fora do escopo.
- **Baixo:** instalação limpa mostrou avisos de scripts de instalação pendentes para `esbuild` e `@scarf/scarf`, sem vulnerabilidade reportada.

## NÃO TESTADO

- Migrations, seed e consultas no PostgreSQL/PostGIS: porta 5432 existe, mas a credencial documentada falhou com `28P01`; Docker e `psql` não estão instalados.
- Build/boot real do Dockerfile e `docker-compose.production.yml`.
- Persistência real de usuários, planos, correções e `audit_logs` após reinício.
- Importação real das 720.349 linhas no banco e tempo/espaço finais.
- Endpoint geoespacial PostGIS com campi verificados, pois não há registros/fonte complementar.
- Deploy externo, TLS, proxy reverso e comportamento multi-réplica.
- Auditoria completa WCAG por axe: o comando `agent-browser a11y` expirou; foram verificados nomes acessíveis, labels, `lang`, imagens e um H1 por rota, mas não contraste automatizado completo.
- Geolocalização em hardware real; foi testada com permissão e coordenada simuladas pelo navegador.

## Comandos principais executados

```powershell
npm ci
npm test
npm run build
npm audit --omit=dev
npm outdated --json
npm run dev
npm start -w @faculdade-perto/api
```

Também foram executados:

- requisições `Invoke-WebRequest` para toda a matriz REST, Swagger, robots, sitemap e 404;
- scripts Node/Playwright para fluxos e viewports;
- scripts streaming com `csv-parse` sobre os 720.349 registros oficiais;
- tentativa de conexão PostgreSQL com `pg` e `SELECT postgis_full_version()`;
- tentativa de auditoria `agent-browser a11y`.

## Limitações da nota

A nota não chega a 10 principalmente por três fatores: banco real não executado, arquitetura de 139 milhões de métricas não validada e SEO dinâmico sem renderização no servidor. Resolver apenas detalhes visuais ou aumentar testes unitários não elimina esses riscos.

## Arquivos modificados nesta auditoria

- `.env.example`, `.dockerignore`, `Dockerfile`, `docker-compose.production.yml`, `README.md`;
- `apps/api/src/app.js`, `config/env.js`, `controllers/catalogController.js`;
- `importers/censo/CensoImporter.js`, `importers/censo/mapping.js`, `importers/censo/mapping.test.js`;
- `middlewares/errorHandler.js`;
- `repositories/authRepository.js`, `catalogRepository.js`, `demoAuthRepository.js`, `demoRepository.js`;
- `routes/schemas.js`, `services/authService.js`, `services/catalogService.js`;
- `app.test.js` e o novo `security.integration.test.js`;
- `apps/web/vite.config.js`;
- `components/SearchBar.jsx`, `SearchBar.test.js`, `SiteLayout.jsx`;
- `lib/searchParams.js`;
- `pages/CityPage.jsx`, `InstitutionPage.jsx`, `RecordPage.jsx`;
- `styles/global.css`; remoção de `public/robots.txt`;
- `docs/implementacao.md`, este relatório e as evidências PNG desktop/mobile.
