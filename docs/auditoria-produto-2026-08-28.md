# Auditoria de produto — 28 de agosto de 2026

## Estado inicial

- React e JavaScript organizados em páginas, componentes, serviços e utilitários.
- API Node/Express com CockroachDB remoto, validação, rate limiting e dados nacionais do Censo 2024.
- 55 testes automatizados aprovados antes das alterações.
- Busca, filtros, mapa, comparação, Meu Plano, Enem, formulários, sitemap e páginas legais funcionais.
- Produção publicada no Render e banco com limite mensal controlado.

## Riscos prioritários encontrados

1. `db:migrate` era executado a cada reinício do serviço, elevando consumo e podendo impedir o boot quando o banco atingisse o limite.
2. Não existe alerta automático para consumo de Request Units; o limite precisa de acompanhamento no CockroachDB.
3. A jornada atual ajuda a localizar registros, mas ainda não orienta a decisão.
4. SEO dinâmico depende do JavaScript; páginas estratégicas se beneficiarão de prerenderização futura.
5. e-MEC e indicadores regulatórios ainda não foram integrados, portanto o site não deve afirmar oferta ou situação atual.

## Ordem adotada

1. boot confiável e controle de consumo;
2. acessibilidade e metadados críticos;
3. Bússola da Escolha com cálculo local, explicável e sem novas consultas;
4. busca, mapa e planejamento;
5. fontes complementares, SEO e expansão operacional.

## Decisão de arquitetura da Bússola

As preferências ficam inicialmente no navegador. A compatibilidade é calculada no frontend sobre os registros já retornados pela busca, evitando novas varreduras no banco. O cálculo usa pesos explícitos, não infere qualidade acadêmica e preserva dados ausentes como pendências.
