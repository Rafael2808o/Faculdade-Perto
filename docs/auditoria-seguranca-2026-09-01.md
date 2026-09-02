# Auditoria defensiva de segurança — atualizada em 02/09/2026

## Escopo

Revisão não destrutiva do frontend React, API Express, autenticação, autorização, consultas PostgreSQL/CockroachDB, configuração de produção e dependências. Não foram executados ataques contra o Render, o CockroachDB ou serviços de terceiros.

## Resultado

Não foi identificada vulnerabilidade crítica ou alta conhecida após as correções desta rodada. `npm audit --omit=dev --audit-level=moderate`, executado com a cadeia de certificados do sistema, reportou zero vulnerabilidades conhecidas. Isso não significa que o sistema seja impossível de comprometer.

## Achados corrigidos

| Gravidade | Achado | Correção | Evidência |
| --- | --- | --- | --- |
| Média | Token de sessão acessível ao JavaScript em `localStorage` | Sessão migrada para cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção e expiração de 30 dias; token removido da resposta web | testes de integração de cadastro, cookie, logout e revogação |
| Média | Login compartilhava apenas o limite genérico de escrita | Limite específico de dez tentativas falhas por janela, sem contar acessos válidos | teste de limites e configuração de rota |
| Média | Consulta de cortes aceitava paginação e filtros sem schema próprio | Validação Zod, limite máximo de 100 itens e score entre 0 e 1000 | testes da rota `/cutoffs` |
| Baixa | Política de recursos do navegador não declarava câmera/microfone/geolocalização | `Permissions-Policy` bloqueia câmera e microfone e limita geolocalização à própria origem | teste manual dos cabeçalhos após publicação |
| Baixa | Documentação OpenAPI descrevia apenas Bearer | Cookie de sessão e compatibilidade Bearer documentados | OpenAPI gerada no build |
| Média | `qs` 6.15.3 transitivo possuía duas falhas de negação de serviço publicadas em 02/09/2026 | Versão corrigida 6.16.0 fixada para toda a árvore; Express configurado explicitamente com `query parser: simple` | `npm audit`, lockfile e teste de configuração |

## Controles confirmados

- consultas parametrizadas nas rotas públicas e privadas revisadas;
- validação Zod de corpo, parâmetros e query string;
- senha com `scrypt`, salt aleatório e comparação em tempo constante;
- token opaco aleatório; somente SHA-256 do token é persistido;
- sessão revogável e com expiração;
- isolamento do Meu Plano por usuário e verificação de função na administração;
- CSP, HSTS e demais cabeçalhos do Helmet;
- CORS restrito às origens configuradas;
- payload JSON limitado a 200 KB;
- URLs de evidência limitadas a HTTP/HTTPS;
- erros internos não devolvem stack trace ao cliente;
- pool, conexão e consultas de banco possuem limites de tempo;
- builds de produção sem source maps públicos;
- segredos e `.env` ignorados pelo Git.

## Riscos residuais

1. O rate limit usa memória do processo; com múltiplas réplicas ele não compartilha contadores. Uma implantação horizontal deve usar um armazenamento central.
2. Não há verificação de e-mail, recuperação de senha nem autenticação multifator.
3. A CSP ainda permite estilo inline porque componentes atuais dependem disso. Remover essa exceção exige migrar estilos dinâmicos para classes ou nonce.
4. Logs de erro ficam no provedor de hospedagem; a política operacional de acesso e retenção deve ser revisada periodicamente.
5. Não foi feito pentest externo nem varredura DAST autenticada em produção.
6. Dependências podem adquirir vulnerabilidades após esta data; o CI e as atualizações precisam continuar ativos.

## Validação executada

- 82 testes automatizados de API e frontend;
- build Vite de produção sem source maps;
- `git diff --check` sem erro;
- `npm audit` sem vulnerabilidade conhecida;
- revisão visual local de mapa e calculadora em desktop e 390 × 844;
- validação HTTP e smoke test de produção previstos após o deploy desta versão.
