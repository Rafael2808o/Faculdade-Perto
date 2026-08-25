# Supabase como alternativa de banco

O banco principal de produção é o CockroachDB Basic. Este documento preserva o estudo do Supabase como alternativa para uma edição reduzida ou um plano pago. O plano gratuito não comporta o catálogo nacional completo. Em qualquer provedor, o backend Express continua sendo a única camada que lê e grava as tabelas; o frontend não recebe senha do banco nem uma `service_role` key.

## Conexões

- use o **Session pooler** na porta `5432` para migrations, `pg_dump`, `pg_restore`, `COPY` e processos persistentes em redes IPv4;
- use o pooler adequado à plataforma de hospedagem para a API;
- mantenha `DATABASE_SSL=true` em produção;
- guarde `DATABASE_URL` somente no gerenciador de segredos da hospedagem e no `.env` local ignorado pelo Git.

Exemplo sem credenciais reais:

```env
DATABASE_PROVIDER=supabase
DATABASE_URL=postgres://postgres.PROJECT_REF:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
DATABASE_POOL_MAX=5
DATA_MODE=database
```

## Segurança

A migration `003_supabase_security.sql` habilita Row Level Security e remove acesso direto dos papéis `anon` e `authenticated`. Não crie policies públicas para as tabelas de catálogo, usuários, sessões, contatos ou correções. Todas as operações passam pela API Express, que aplica validação, autorização e rate limit.

## Capacidade observada em 24/08/2026

- banco local completo: aproximadamente **1.718 MB**;
- `course_catalog_records`: aproximadamente **1.696 MB**;
- JSONs dos 223 campos brutos: aproximadamente **1.273 MB**;
- registros censitários: **720.349**;
- instituições: **2.561**.

O plano Free limita a base a 500 MB e entra em modo somente leitura ao ultrapassar a cota. A cópia integral requer um plano com capacidade superior. Uma edição reduzida pode remover os JSONs brutos, mas deixa de atender ao requisito de mostrar todos os 223 campos no detalhe; por isso ela deve ser uma decisão explícita, não uma perda silenciosa.

## Ordem de migração

1. criar um projeto Supabase dedicado;
2. copiar a URL do Session pooler e armazená-la como segredo;
3. executar `npm run db:migrate` contra o Supabase;
4. migrar a carga com `pg_dump`/`pg_restore` ou reexecutar o importador oficial;
5. importar os centroides municipais;
6. validar `/api/health`, totais, busca, detalhes e mapa;
7. executar `npm test` e `npm run build`;
8. manter o banco local até a validação e o rollback estarem documentados.
