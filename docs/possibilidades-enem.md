# Possibilidades pela nota do Enem

## O que a ferramenta faz

A calculadora obtém a média simples ou ponderada das cinco notas informadas. Depois, a área “Onde sua nota esteve competitiva?” compara cada prova com os pesos e mínimos publicados no termo de adesão da mesma edição do processo seletivo.

A comparação é retrospectiva. Ela não prevê o processo atual, não calcula probabilidade estatística, não valida documentos ou cotas e nunca representa garantia de vaga.

## Cobertura verificável em 3 de setembro de 2026

- instituição: Universidade Federal de Minas Gerais — UFMG;
- processo: SiSU/UFMG, primeira edição de 2026;
- relatórios: chamada regular e 13 relatórios após chamadas da lista de espera;
- cursos: 94 combinações oficiais de código e turno, em Belo Horizonte e Montes Claros;
- cenários: 10.332 linhas separadas por curso/turno, modalidade de concorrência e etapa;
- reconciliação: 10.332 linhas aceitas e nenhuma correspondência ambígua;
- pesos, notas mínimas por prova e vagas: termo de adesão oficial da própria edição.

Essa cobertura é parcial. O site não extrapola o histórico da UFMG para outras instituições ou anos.

## Faixas apresentadas

| Diferença | Rótulo | Interpretação limitada |
| --- | --- | --- |
| 20 pontos ou mais acima | Historicamente favorável | A nota ficou acima desse cenário passado com alguma margem. |
| De 0 a 19,99 acima | Competitiva | A nota ficou acima do mínimo publicado, mas próxima dele. |
| Até 20 pontos abaixo | Próxima da faixa | Uma pequena variação de nota ou faixa mudaria a posição relativa. |
| Mais de 20 pontos abaixo | Cenário mais difícil | A nota ficou abaixo desse mínimo histórico. |

Os limites são regras de apresentação, não probabilidades. O cartão mostra a diferença numérica para que a informação não dependa apenas da cor.

## Chamadas e modalidades

- chamada regular e cada um dos 13 relatórios posteriores podem ser filtrados separadamente;
- cada modalidade de concorrência permanece em linha própria;
- o relatório posterior informa máximos e mínimos acumulados depois daquela convocação; não é a nota exclusiva de quem entrou naquela chamada;
- pesos são aplicados apenas quando encontrados no termo da mesma edição;
- uma nota abaixo do mínimo de prova conhecido não é comparada;
- treineiros recebem aviso de inelegibilidade e não são classificados.

## Dados insuficientes

Se não houver histórico oficial para o curso, local, modalidade ou etapa, o site apresenta a ausência. Ele não completa a lacuna com médias genéricas, conteúdo publicitário ou estimativas geradas por IA.

## Fontes oficiais

- página de notas da UFMG: <https://www.ufmg.br/sisu/vagas/notas-de-corte/>;
- repositório dos relatórios 2026: <https://www.ufmg.br/sisu/repositorio/?edicao=sisu-ufmg-2026&repositorio_tipo=nota-corte>;
- termo de adesão 2026: <https://www.ufmg.br/sisu/wp-content/uploads/2026/01/termo_adesao_575_UFMG-16-ASSINADO.pdf>;
- dados abertos nacionais do SiSU: <https://dadosabertos.mec.gov.br/sisu>. Na consulta de 3 de setembro de 2026, o conjunto nacional publicado chegava a 2023, por isso não foi misturado com os relatórios UFMG 2026.

## Privacidade

Notas e filtros são enviados por `POST` somente para calcular a comparação atual, com resposta `Cache-Control: no-store`. Não são gravados no perfil nem colocados na URL. A interface solicita o código da modalidade do edital e não coleta renda, raça, deficiência ou documentos.
