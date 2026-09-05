# Operação do catálogo nacional

## Estado local validado em 21/08/2026

- modo da aplicação: `database`;
- PostgreSQL isolado: `127.0.0.1:55432`;
- IES do Censo 2024: **2.561**;
- registros censitários de curso: **720.349**;
- cursos CINE canônicos: **353**;
- municípios presentes nos registros: **3.551**;
- registros rejeitados: **0**;
- campos preservados por registro de curso: **223**;
- tamanho observado do banco após `VACUUM ANALYZE`: aproximadamente **2,2 GB**.

O cluster local fica em `.local-postgres/`, ignorado pelo Git. `npm run dev:national` inicia esse cluster antes da aplicação; `npm run dev` usa o banco já configurado no `.env`. Para encerrá-lo manualmente, use `npm run db:local:stop`.

## Fontes e semântica

O catálogo educacional é a fotografia oficial do Censo da Educação Superior 2024. A geografia vem da API de Malhas do IBGE e é usada somente para calcular o centroide municipal. A distância exibida é em linha reta até essa referência, nunca até um campus.

O Censo não fornece campus/polo individual, endereço atual de cada oferta, mensalidade, processo seletivo vigente ou nota de corte. Esses campos continuam `não confirmado` até existir uma fonte pública oficial que permita vinculação segura. O Cadastro e-MEC é a referência regulatória atual, mas sua consulta/exportação deve ser tratada como enriquecimento separado da fotografia censitária.

## Estratégia nacional de atualização contínua

O catálogo não deve depender de uma única fonte. A ordem de confiança é:

1. atos autorizativos, Diário Oficial, INEP, e-MEC e bases governamentais;
2. páginas e editais publicados no domínio oficial da instituição;
3. conselhos estaduais, SiSU, Prouni, Fies e portais públicos municipais;
4. fontes secundárias apenas para descoberta, nunca para confirmar um registro.

Cada informação complementar precisa guardar URL, data de coleta, hash do conteúdo e vínculo com `source_records`. Nomes populares, mantenedoras e marcas entram em `institution_aliases`, permitindo que uma pesquisa como “FEA” encontre FISMA e FCAA sem duplicar instituições. Ofertas recentes ficam separadas da fotografia censitária e nunca são apresentadas como Censo 2024.

Não existe uma publicação pública nacional em tempo real capaz de provar literalmente todas as ofertas ativas. Por isso, a meta operacional é cobertura máxima verificável, atualização incremental e exposição transparente da fonte e da data de cada registro. A camada complementar atual reúne Medicina da FIRB/UNIANDRADINA e sete páginas de cursos da FEA em Andradina. Nenhuma delas recebe coordenada inventada; conflitos de endereço permanecem visíveis.

## Reproduzir a carga

1. Rode `npm run db:migrate` com `DATABASE_URL` apontando para PostgreSQL.
2. Importe os dois CSVs oficiais com `node apps/api/src/importers/censo/cli.js --ies ... --courses ... --sha256 ...`.
3. Gere centroides a partir do GeoJSON oficial do IBGE com `scripts/build-centroids-from-geojson.js`.
4. Rode `node apps/api/src/importers/municipalities/cli.js --file ...`.
5. Valide com `npm test`, `npm run build` e os endpoints `/api/health`, `/api/v1/search` e `/api/v1/catalog-records/:id`.

## Reproduzir os históricos UFMG 2026

1. Execute `npm run collect:ufmg`. O coletor aceita somente HTTPS no domínio oficial da UFMG e exige que os 14 PDFs estejam referenciados no repositório institucional.
2. Na primeira coleta, extraia relatórios e termo com `python scripts/extract-ufmg-history.py .local-data/official-2026`. Em atualizações que preservam o mesmo termo, `--reports-only` evita repetir esse trabalho. Os arquivos e dados intermediários ficam em `.local-data`, fora do Git.
3. Execute `npm run import:ufmg` para validar 10.332 cenários sem escrever no banco.
4. Depois de revisar contagens, hashes e uma amostra visual, execute `npm run import:ufmg -- --apply`.
5. Execute `node --use-system-ca scripts/verify-admission-history.js` para confirmar 14 etapas, 94 combinações de curso/turno e a cobertura de Andradina no banco remoto.

O importador é idempotente, usa chaves naturais estáveis e interrompe a carga se um relatório não contiver 738 linhas reconciliadas ou se uma combinação não tiver correspondência única no termo oficial.
