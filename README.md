# Faculdade Perto

**Encontre cursos e instituições de ensino superior sem esconder a fonte ou os limites dos dados.**

O Faculdade Perto é um site nacional de pesquisa educacional construído com React e JavaScript. Ele reorganiza os microdados oficiais do Censo da Educação Superior 2024, oferece busca com mapa e mantém uma política explícita de ausência: aquilo que a fonte não publica aparece como **não confirmado**.

## Teste o projeto

**[Abrir o Faculdade Perto](https://faculdade-perto.onrender.com/)**

O serviço gratuito pode levar alguns segundos para despertar no primeiro acesso. Depois disso, site, API e documentação funcionam na mesma origem.

## O que está implementado

- React em JavaScript, responsivo e acessível;
- busca por curso, instituição e cidade, com filtros de UF, rede, categoria administrativa, organização acadêmica, modalidade, grau, turno, gratuidade, dimensão e vagas mínimas;
- mapa Leaflet/OpenStreetMap em split view, raio de 5–100 km e localização do usuário;
- Bússola da Escolha com preferências explicáveis, compatibilidade e cenários alternativos;
- referências municipais claramente separadas de campi;
- páginas de instituição, registro de curso, cidade, FAQ, contato, correção, agradecimento e 404;
- calculadora Enem simples e ponderada, com aviso de treineiro;
- conta com sessão revogável, Meu Plano persistente, checklist local e comparação de até quatro cursos;
- fila administrativa de correções com perfis, moderação e trilha de auditoria;
- selos de dado importado/confirmado/não confirmado com fonte e data;
- API REST `/api/v1` em `routes → controllers → services → repositories → models/persistência`;
- Swagger UI em `/api/docs` e OpenAPI JSON em `/api/docs/openapi.json`;
- PostgreSQL, migrations, histórico de observações, verificações, mensalidades, ingresso e notas de corte;
- importador nacional via `COPY`, em lote e idempotente, para os dois CSVs do Censo Superior 2024;
- sitemap XML dinâmico, robots, metadados únicos, Open Graph e JSON-LD;
- rate limit e validação campo a campo em contato/correção;
- testes das regras críticas.

## Arquitetura

```text
Faculdade Perto/
├── apps/api/                 API REST em Node.js, Express e JavaScript
│   └── src/
│       ├── controllers/      Entrada e saída HTTP
│       ├── services/         Regras de negócio
│       ├── repositories/     Consultas e persistência
│       ├── database/         Pool, migrations e seed
│       └── importers/        Carga nacional do Censo 2024
├── apps/web/                 Site React + Vite em JavaScript
│   └── src/
│       ├── pages/            Páginas e rotas
│       ├── components/       Componentes reutilizáveis
│       ├── services/         Comunicação com a API
│       ├── lib/              Sessão e utilidades locais
│       └── styles/           Tokens e estilos globais
├── docs/                     Auditorias e operação
├── scripts/                  Banco local, auditorias e migração de dados
└── render.yaml               Publicação Node.js nativa no Render
```

| Camada | Tecnologias |
| --- | --- |
| Site | React 18, React Router, TanStack Query, Leaflet e Vite |
| API | Node.js, Express, Zod e OpenAPI |
| Banco | PostgreSQL local e CockroachDB Basic em produção |
| Dados | Microdados oficiais do Censo da Educação Superior 2024 |
| Produção | Node.js nativo no Render |

## Princípios do produto

- **Transparência:** cada informação informa fonte, ano, importação e nível de confirmação.
- **Honestidade:** sede administrativa e referência municipal nunca são anunciadas como campus.
- **Utilidade:** busca, filtros, mapa, comparação e Meu Plano reduzem o caminho até uma decisão informada.
- **Privacidade:** a interface nunca recebe a senha do banco; sessões podem ser revogadas e segredos ficam fora do Git.
- **Acessibilidade:** navegação semântica, atalhos de conteúdo, nomes acessíveis e estados de erro fazem parte da experiência.

## Limite factual preservado

O microdado público do Censo 2024 não individualiza campus, polo, endereço de local de oferta, turno da oferta ou situação regulatória atual. Por isso:

- a sede administrativa nunca vira campus;
- uma linha do Censo é chamada de `census_course_record`, não de oferta ativa;
- `QT_VG_*` é estatística de 2024, não vaga aberta hoje;
- mensalidade, nota de corte e localização de campus ficam não confirmadas sem fonte complementar.

Veja [o blueprint](./docs/fase-1-blueprint.md) e [o mapeamento das 307 colunas](./docs/censo-2024-field-map.md).

## Desenvolvimento rápido

Requisitos: Node.js 20+.

```bash
npm install
npm run db:local:start
npm run db:migrate
npm run db:seed
npm run dev
```

Abra `http://localhost:5173`. O banco configurado em `.env` deve estar ativo antes das migrations. Para trabalhar com a carga nacional local já inicializada na porta `55432`, use `npm run dev:national`. O modo demo existe apenas para os testes automatizados.

## Banco de dados

Em produção, o banco prioritário é o **CockroachDB Basic**, compatível com o protocolo PostgreSQL e dimensionado para preservar a carga nacional completa. A aplicação usa TLS, pool limitado e repetição automática de transações serializáveis. Consulte [a operação no CockroachDB](./docs/cockroachdb.md). O [Supabase](./docs/supabase.md) permanece documentado como alternativa gerenciada, mas seu plano gratuito não comporta este catálogo completo.

Para iniciar o PostgreSQL local empacotado pelo projeto no Windows:

```bash
npm run db:local:start
npm run db:migrate
npm run db:seed
```

Use `npm run db:local:stop` para encerrá-lo. O projeto não depende de Docker.

Defina `DATA_MODE=database` para exigir o banco. Em produção esse modo já é obrigatório; a aplicação não cai silenciosamente para a amostra.

## Importação nacional do Censo

Baixe e extraia o pacote oficial de 2024. Depois das migrations:

```bash
npm run import:censo -- --ies "caminho/MICRODADOS_ED_SUP_IES_2024.CSV" --courses "caminho/MICRODADOS_CADASTRO_CURSOS_2024.CSV" --sha256 "HASH_SHA256_DO_ZIP"
```

O importador:

1. registra a fonte e o snapshot imutável;
2. preserva cada linha em `source_records`;
3. usa chaves naturais estáveis;
4. preserva os 223 campos originais de cada linha em `raw_payload` e projeta métricas de busca em colunas próprias;
5. registra rejeições sem descartá-las;
6. reaplicar o mesmo snapshot faz upsert, sem duplicar identidades ou métricas.

O pacote verificado durante a construção tinha SHA-256 `e8e11899efe2b348a7e80e3a3c610c3bdd1ced3362ccdf2c9f9abe9bf8988386` e 720.349 linhas de curso com chave natural única. Recalcule o hash do arquivo obtido antes de importar: o INEP pode republicar o mesmo ano.

## Qualidade

```bash
npm test
npm run build
npm run test:smoke -- https://faculdade-perto.onrender.com
npm run test:production
```

Os 62 testes automatizados cobrem média simples/ponderada, aviso de treineiro, modalidades de corte não agregadas, campo sem fonte impedido de virar confirmado, distância geodésica compatível com CockroachDB, IDs BIGINT sem perda de precisão, chave idempotente do importador, filtros, Bússola, cenários, checklist de decisão, autenticação, autorização, isolamento do Meu Plano, revogação de sessão, limites HTTP, CORS, rate limit e validações da correção. O smoke test acrescenta verificações integradas de banco, busca, detalhe, instituição, OpenAPI, robots, sitemaps, páginas React e 404. A auditoria de produção percorre ainda os 27 estados, combinações de filtros, ordenações, autenticação e gravações com limpeza posterior.

Consulte [a operação do catálogo nacional](./docs/operacao-catalogo-nacional.md). A carga completa foi ensaiada localmente: 2.561 IES, 720.349 registros de curso, 223 campos por registro e zero rejeições. A estratégia evita materializar cerca de 139 milhões de valores `QT_*` como linhas separadas.

## Produção

Copie `.env.example`, configure `PUBLIC_SITE_URL`, `DATABASE_PROVIDER=cockroach` e a `DATABASE_URL` fornecida pelo CockroachDB. Nunca envie o `.env` ao Git. O `render.yaml` compila o React e publica site e API no mesmo serviço Node.js nativo. Migrations são executadas de forma controlada somente quando há mudança de esquema; elas não rodam em todo reinício e não desperdiçam RUs. Não há imagem ou dependência de Docker.

Cadastros públicos sempre começam como usuário comum; conceda `reviewer` ou `admin` somente por um procedimento operacional autenticado no banco, depois de verificar a identidade da pessoa.

O servidor Express entrega o frontend compilado, a API, `/robots.txt` e `/sitemap.xml` na mesma origem. Isso evita CORS e mantém as URLs canônicas consistentes.

## Endpoints principais

| Área | Endpoints |
| --- | --- |
| Saúde | `GET /api/health` |
| Busca | `GET /api/v1/search`, `GET /api/v1/institutions`, `GET /api/v1/courses` |
| Catálogo | `GET /api/v1/catalog-records/:id`, `GET /api/v1/institutions/:id` |
| Autenticação | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `DELETE /api/v1/auth/session` |
| Meu Plano | `GET /api/v1/me/plan`, `POST /api/v1/me/plan`, `DELETE /api/v1/me/plan/:id` |
| Participação | `POST /api/v1/contact`, `POST /api/v1/corrections` |
| Administração | `GET /api/v1/admin/corrections`, `PATCH /api/v1/admin/corrections/:id` |
| Descoberta | `GET /sitemap.xml`, `GET /robots.txt`, `GET /api/docs/openapi.json` |

A documentação interativa completa fica em `/api/docs`.

## Segurança e privacidade

- Helmet e uma política CSP restringem recursos e origens permitidas.
- CORS aceita somente as origens configuradas.
- Zod valida parâmetros e corpos antes da regra de negócio.
- Endpoints de escrita têm limite de requisições.
- Senhas usam hash `scrypt`; somente o hash do token de sessão é persistido.
- Papéis `reviewer` e `admin` são verificados na API, não apenas na interface.
- URLs de evidência rejeitam esquemas executáveis.
- `.env`, ferramentas locais, dados brutos e builds não são versionados.

## Estado do projeto

A branch `master` é a fonte de publicação. A carga de referência contém 2.561 instituições, 353 cursos canônicos, 3.551 municípios e 720.349 registros censitários, com os 223 campos oficiais preservados por registro. Mensalidade, campus, endereço de oferta e nota de corte permanecem não confirmados até a inclusão de uma fonte complementar confiável.

## Contribuição

1. Crie uma branch a partir de `master`.
2. Faça alterações pequenas e objetivas.
3. Execute `npm test`, `npm run build` e o smoke test relacionado.
4. Não envie segredos, arquivos `.env`, microdados brutos ou executáveis locais.
5. Descreva no pull request o problema, a solução e como ela foi validada.

## Fontes

- https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior
- https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_2024.zip
- https://www.gov.br/mec/pt-br/politica-regulacao-supervisao-educacao-superior/cadastro-nacional-de-cursos-e-ies
