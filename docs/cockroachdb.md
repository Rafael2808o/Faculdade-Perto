# CockroachDB Cloud

O catálogo nacional de produção usa um cluster CockroachDB Basic. A API continua usando o driver PostgreSQL (`pg`), mas ativa adaptações específicas por meio de `DATABASE_PROVIDER=cockroach`.

## Configuração

```env
DATA_MODE=database
DATABASE_PROVIDER=cockroach
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:26257/defaultdb?sslmode=verify-full
DATABASE_SSL=true
DATABASE_POOL_MAX=3
DATABASE_CONNECTION_TIMEOUT_MS=30000
DATABASE_IDLE_TIMEOUT_MS=30000
DATABASE_STATEMENT_TIMEOUT_MS=300000
```

Não versione a URL real. Ela contém a senha do usuário SQL e deve ser cadastrada como segredo no serviço de hospedagem.

## Compatibilidade

- migrations removem apenas as extensões PostgreSQL que o CockroachDB não oferece;
- buscas sem acento usam normalização SQL portável;
- o catálogo usa uma chave natural explícita para manter o upsert idempotente quando há campos nulos;
- transações repetem automaticamente erros serializáveis `40001` até cinco vezes;
- arquivos do INEP em Latin-1 são convertidos para UTF-8 durante a importação remota.

## Migração do PostgreSQL local

Mantenha a origem e o destino no `.env` local:

```env
SOURCE_DATABASE_URL=postgres://faculdade@127.0.0.1:55432/faculdade_perto
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:26257/defaultdb?sslmode=verify-full
DATABASE_PROVIDER=cockroach
```

Depois execute:

```bash
npm run db:migrate
npm run db:migrate:cockroach:source-records
npm run db:migrate:cockroach:catalog
npm run db:migrate:cockroach:data
npm run db:verify:cockroach
```

Se uma cópia direta do catálogo for interrompida, preserve os registros que já chegaram e execute `npm run db:migrate:cockroach:catalog:resume`. O script descobre lacunas contíguas de IDs, valida a quantidade faltante na origem e envia somente esses intervalos antes de restaurar índices e relacionamentos.

O catálogo principal usa o **MOLT**, ferramenta oficial da Cockroach Labs, em cópia direta e paralela. O executável local fica em `.tools/molt/` e nunca é versionado. Durante essa etapa o script remove somente os índices e as chaves estrangeiras do catálogo que impediriam a carga eficiente, copia os dados e restaura toda a estrutura mesmo se ocorrer uma falha.

O segundo migrador percorre as demais tabelas em ordem de dependência, preserva IDs e JSONs originais e confere a contagem de cada uma. Uma tabela já completa é ignorada com segurança; um destino parcial que não seja um prefixo íntegro interrompe o processo para evitar duplicação.

Por fim, `db:verify:cockroach` compara todas as tabelas, colunas compartilhadas, contagens, intervalos de IDs, amostras de borda e confirma os índices e relacionamentos essenciais do catálogo.

## Segurança e custos

- não adicione método de pagamento quando o objetivo for operar somente na faixa gratuita;
- use um limite mensal compatível com os recursos gratuitos exibidos no console;
- mantenha apenas a API como cliente direto do banco;
- regenere imediatamente uma senha que tenha sido enviada por mensagem, log ou captura pública;
- acompanhe armazenamento e Request Units no painel do cluster.
