# Possibilidades pela nota do Enem

## O que a ferramenta faz

A calculadora obtém a média simples ou ponderada das cinco notas informadas. Depois disso, a pessoa pode consultar cenários históricos que já tenham sido importados na tabela `cutoff_scores` e vinculados a uma oferta, edição, modalidade de concorrência, rodada e fonte oficial.

Essa comparação é retrospectiva. Ela não prevê o resultado do processo atual, não calcula uma probabilidade estatística e nunca representa garantia de vaga.

## Faixas apresentadas

A interface compara a média calculada com um corte histórico individual, sem misturar modalidades de concorrência:

| Diferença | Rótulo | Interpretação limitada |
| --- | --- | --- |
| 20 pontos ou mais acima | Historicamente favorável | A nota ficou acima desse cenário passado com alguma margem. |
| De 0 a 19,99 acima | Competitiva | A nota ficou acima do corte, mas próxima dele. |
| Até 20 pontos abaixo | Próxima da faixa | Uma pequena variação de nota ou corte mudaria a posição relativa. |
| Mais de 20 pontos abaixo | Cenário mais difícil | A nota ficou abaixo desse corte histórico. |

Os limites são regras de apresentação, não probabilidades de aprovação. O cartão também mostra a diferença numérica para que a pessoa não dependa apenas da cor ou do rótulo.

## Chamadas e modalidades

- `chamada regular` e `lista de espera` permanecem categorias distintas;
- segunda, terceira ou chamadas posteriores só podem aparecer quando a fonte identifica a rodada;
- ampla concorrência e cada modalidade de reserva de vagas ficam em linhas separadas;
- pesos são aplicados apenas quando conhecidos por fonte oficial para aquele processo.

## Dados insuficientes

Se não houver histórico oficial importado para o curso, local e modalidade pesquisados, o site apresenta “Ainda não há histórico oficial importado para este cenário”. Ele não completa a lacuna com médias genéricas, conteúdo publicitário ou estimativas geradas por IA.

Em 1º de setembro de 2026, a estrutura e a API estão implementadas, mas o banco de produção ainda não possui linhas em `cutoff_scores`. A importação nacional de históricos do SiSU continua pendente de aquisição, normalização, reconciliação e validação dos arquivos oficiais por edição.

## Fontes prioritárias

- Portal oficial de selecionados e relatórios do SiSU: <https://sisu.mec.gov.br/selecionados/>
- Dados abertos do MEC: <https://dadosabertos.mec.gov.br/sisu>
- Editais e chamadas publicados pelas próprias instituições, quando usados como complemento e versionados com URL e data.

## Privacidade

Notas, pesos e filtros da calculadora não são persistidos no perfil. A API recebe somente o necessário para calcular a média ou consultar os cortes. Critérios sensíveis de reserva de vagas não devem ser armazenados sem finalidade e consentimento específicos.
