# Fontes complementares e ofertas verificadas

## Por que existe uma camada separada

O Censo da Educação Superior é a base nacional de referência, mas representa um retrato anual agregado. Ele não comprova, sozinho, que um curso esteja recebendo inscrições agora, nem fornece o endereço exato de cada campus. Por isso, o Faculdade Perto mantém `course_catalog_records` para o retrato censitário e `course_offerings` para ofertas individualizadas sustentadas por outra fonte.

Uma oferta atual nunca substitui nem altera silenciosamente a linha histórica do Censo. Na busca, os dois conjuntos aparecem em seções distintas.

## Ordem de confiança

1. atos autorizativos, INEP, e-MEC, Diário Oficial e outros portais governamentais;
2. edital ou página publicada no domínio oficial da instituição;
3. portais oficiais de ingresso, como SiSU, Prouni e Fies;
4. fonte secundária apenas para descobrir uma possível atualização, nunca para confirmá-la.

Cada registro complementar guarda fonte, URL canônica, período de referência, data de coleta, hash, chave natural e payload original. A migration é idempotente e aliases não criam uma segunda instituição.

## Primeiro registro verificado

Em 1º de setembro de 2026 foi vinculada a oferta de Medicina, bacharelado presencial integral, da Faculdades Integradas Rui Barbosa (FIRB/UNIANDRADINA), em Andradina. O portal oficial informa o período 2026.2 e o endereço Rua Rodrigues Alves, 756, Centro.

Fonte: <https://medicina.firb.br/>.

A página oficial não publica coordenadas geográficas verificáveis. O site mostra o endereço confirmado, mas não cria um marcador exato de campus. Isso evita apresentar um centroide municipal como localização física.

## Reconciliação

- `inep_code` preserva a identidade institucional conhecida;
- `institution_aliases` liga marca, sigla e nome popular à mesma instituição;
- município e UF precisam corresponder exatamente, evitando misturar Andradina com Nova Andradina;
- sede, campus e polo permanecem entidades diferentes;
- conflitos não são resolvidos por suposição: ficam pendentes até nova evidência;
- uma nova coleta gera snapshot próprio, mantendo o histórico da fonte.

## Limite atual

Esta estrutura permite ampliar a cobertura nacional com segurança, mas não significa que todas as ofertas atuais do Brasil já estejam confirmadas. A carga principal continua sendo o Censo 2024, e a cobertura complementar cresce conforme fontes oficiais podem ser vinculadas sem ambiguidade. O site deve informar essa diferença em toda listagem e detalhe.
