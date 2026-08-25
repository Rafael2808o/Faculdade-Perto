# Estado da implementação

## Entrega funcional

A aplicação local validada executa em modo `database`, com o catálogo nacional do Censo Superior 2024 carregado em PostgreSQL. O modo demonstrativo permanece apenas como fixture isolada dos testes.

## Dependências externas para profundidade completa

| Recurso | Situação | Condição para dados públicos |
|---|---|---|
| Instituições e cursos nacionais | importador completo | carregar o ZIP oficial em PostGIS |
| Campus/polo individual | modelo/API preparados; sem registros fabricados | snapshot oficial complementar com identificador e endereço |
| Busca por raio de campus | endpoint PostGIS pronto | coordenadas de campus verificáveis |
| SiSU/ProUni/Fies | tabelas e endpoint de corte preparados | planilhas oficiais por edição e reconciliadas à oferta |
| Mensalidade | histórico e contrato de API preparados | verificação institucional com valor regular e data |
| Oferta ativa | tabela e rotas preparadas | fonte regulatória atual e localização reconciliada |

## Verificações executadas

- build Vite de produção;
- 33 testes automatizados;
- home em desktop e busca split view inspecionadas visualmente;
- navegação busca → detalhe;
- envio contato → agradecimento;
- cadastro → Meu Plano → comparação de cursos;
- correção anônima → fila administrativa → moderação;
- API health, busca, instituição, sitemap e OpenAPI;
- rotas novas e busca verificadas em 1440 px e 390 px, sem overflow;
- ausência de erros de console nos fluxos verificados.

## Decisão de hospedagem

O produto usa PostgreSQL/PostGIS e uma API Express própria, conforme especificação. O runtime de Sites não aceita conexão TCP bruta com PostgreSQL; portanto a publicação apropriada é via container/host Node com PostGIS, usando os arquivos de produção deste repositório. A publicação não deve trocar o banco por uma solução incompatível apenas para gerar uma URL.
