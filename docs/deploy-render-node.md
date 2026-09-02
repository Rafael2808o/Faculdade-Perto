# Deploy Node.js nativo no Render

O Faculdade Perto é publicado como um único Web Service Node.js. O Express entrega a API e os arquivos estáticos gerados pelo Vite na mesma origem. O projeto não usa Docker.

As migrations não fazem parte do comando normal de inicialização. Execute `npm run db:migrate` de forma controlada antes de publicar uma alteração de esquema e confirme o resultado antes do deploy. Essa separação evita que um reinício consuma RUs desnecessariamente ou deixe o serviço indisponível por uma falha de migration.

## Configuração

O arquivo `render.yaml` declara:

- runtime `node` e branch `master`;
- build `npm ci --include=dev && npm run build && npm prune --omit=dev`;
- start `npm start`;
- health check em `/api/health`;
- `DATA_MODE=database` para impedir fallback silencioso em produção;
- pool pequeno e TLS para o CockroachDB Basic.

## Variáveis protegidas

Configure `DATABASE_URL` no painel do Render. Ela nunca deve ser copiada para o repositório, README, logs ou frontend. As demais variáveis públicas e operacionais estão descritas no Blueprint.

## Fluxo de publicação

1. execute `npm test` e `npm run build`;
2. envie a branch `master` ao GitHub;
3. o Render instala dependências, compila o frontend e remove dependências de desenvolvimento;
4. quando houver uma migration nova, aplique-a de forma controlada com `npm run db:migrate` antes de enviar a publicação;
5. o Render inicia somente o servidor, sem reexecutar migrations a cada despertar;
6. valide `/api/health` e execute `npm run test:production`.

O frontend não recebe a conexão do banco. Toda consulta passa pela API, que usa apenas a variável protegida do ambiente de produção.
