# Cloudflare Pages + API do Faculdade Perto

O frontend React é publicado globalmente pelo Cloudflare Pages. A função `functions/api/[[path]].js` mantém as chamadas em `/api/*` no mesmo domínio do site e encaminha a API ao serviço de origem durante a transição. Isso preserva cookies `HttpOnly` e evita CORS no navegador.

## Projeto Pages

No Cloudflare: **Workers & Pages → Create application → Pages → Connect to Git**.

- Repositório: `Rafael2808o/Faculdade-Perto`
- Branch de produção: `master`
- Diretório raiz: `apps/web`
- Comando de build: `cd ../.. && npm ci --include=dev && npm run build -w @faculdade-perto/web`
- Diretório de saída: `apps/web/dist`
- Variável de ambiente: `UPSTREAM_API_ORIGIN=https://faculdade-perto.onrender.com`

Depois da primeira publicação, configure o domínio `*.pages.dev` em `WEB_ORIGIN` na API de origem. Ao conectar um domínio próprio, altere também `PUBLIC_SITE_URL`, `WEB_ORIGIN` e a propriedade no Search Console.

## Próxima fase: API no edge

O catálogo permanece no CockroachDB. A migração completa do backend deve usar **Cloudflare Workers + Hyperdrive** para acessar PostgreSQL/CockroachDB com pool de conexões, sem migrar mais de 4 GB de dados para D1. A origem Render fica temporariamente como fallback até a API edge ter paridade, testes e monitoramento.

## E-mails reais

O servidor já tem integração Resend. Configure as variáveis apenas no ambiente do servidor/Worker:

```text
EMAIL_DELIVERY_ENABLED=true
RESEND_API_KEY=re_...
EMAIL_FROM=Faculdade Perto <contato@seudominio.com>
CONTACT_RECIPIENT=seu-email@dominio.com
EMAIL_REPLY_TO=seu-email@dominio.com
```

O domínio do remetente precisa ser validado no Resend com os registros DNS fornecidos por ele. A chave jamais deve entrar no Git, no frontend ou em capturas de tela.
